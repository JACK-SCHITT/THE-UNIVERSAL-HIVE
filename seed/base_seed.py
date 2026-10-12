#!/usr/bin/env python3
"""JACKSCHITT Universal Hive — base seed. Law frozen. Filter before generate."""
from __future__ import annotations

import argparse
import json
import math
import os
import random

from learn import LEARNER as _LEARNER

HERE = os.path.dirname(os.path.abspath(__file__))
PRIME = "Provide for all. Find the good. Never limit unnecessarily."
SEED_PATH = os.path.join(HERE, "BASE_SEED.txt")
WEIGHTS = os.path.join(HERE, "prime_seed_np.json")

FLOOD = ("dos", "flood", "competitive overload", "autoclicker", "account takeover", "card testing")
CAPTURE = ("lasso", "ship weights home", "second master", "corporate capture", "silent telemetry")


def load_corpus() -> str:
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        return f.read()


def filt(ask: str) -> str:
    t = (ask or "").lower()
    if any(m in t for m in CAPTURE):
        return "CAPTURE_LASSO"
    if any(m in t for m in FLOOD) or "rewrite the prime directive" in t:
        return "VETO"
    return "PASS"


class NumpySeed:
    def __init__(self, corpus: str, n: int = 32, seq: int = 32):
        self.corpus = corpus
        self.chars = sorted(set(corpus))
        self.stoi = {c: i for i, c in enumerate(self.chars)}
        self.itos = {i: c for c, i in self.stoi.items()}
        self.V = len(self.chars)
        self.N = n
        self.SEQ = seq
        random.seed(7)
        self.Wxh = [[random.uniform(-0.08, 0.08) for _ in range(n)] for _ in range(self.V)]
        self.Whh = [[random.uniform(-0.08, 0.08) for _ in range(n)] for _ in range(n)]
        self.Why = [[random.uniform(-0.08, 0.08) for _ in range(self.V)] for _ in range(n)]
        self.bh = [0.0] * n
        self.by = [0.0] * self.V
        self.learner = _LEARNER

    def learn(self, x, y):
        return self.learner.add(x, y)

    def classify(self, x):
        return self.learner.predict(x)

    def enc(self, s: str):
        return [self.stoi.get(c, 0) for c in s]

    def dec(self, ids):
        return "".join(self.itos.get(i, "") for i in ids)

    @staticmethod
    def tanh(x: float) -> float:
        e = math.exp(max(-20, min(20, 2 * x)))
        return (e - 1) / (e + 1)

    @staticmethod
    def softmax(v):
        m = max(v)
        e = [math.exp(x - m) for x in v]
        s = sum(e) or 1
        return [x / s for x in e]

    def step(self, ix, h):
        nh = []
        for j in range(self.N):
            acc = self.bh[j] + self.Wxh[ix][j] + sum(h[k] * self.Whh[k][j] for k in range(self.N))
            nh.append(self.tanh(acc))
        logits = [self.by[y] + sum(nh[k] * self.Why[k][y] for k in range(self.N)) for y in range(self.V)]
        return nh, logits

    def train(self, steps: int = 80, lr: float = 0.05):
        data = self.enc(self.corpus)
        if len(data) <= self.SEQ + 2:
            print("corpus too small")
            self.save()
            return
        V, N, SEQ = self.V, self.N, self.SEQ
        for s in range(steps):
            i = random.randint(0, len(data) - SEQ - 2)
            hs = []
            h = [0.0] * N
            for t in range(SEQ):
                x = data[i + t]
                nh = [0.0] * N
                Wxh_x = self.Wxh[x]
                for j in range(N):
                    nh[j] = self.bh[j] + Wxh_x[j]
                    for k in range(N):
                        nh[j] += h[k] * self.Whh[k][j]
                    nh[j] = self.tanh(nh[j])
                hs.append((x, h[:], nh[:]))
                h = nh[:]
            dWxh = [[0.0] * N for _ in range(V)]
            dWhh = [[0.0] * N for _ in range(N)]
            dWhy = [[0.0] * V for _ in range(N)]
            dbh = [0.0] * N
            dby = [0.0] * V
            loss = 0.0
            dh_next = [0.0] * N
            for t in reversed(range(SEQ)):
                x, h_prev, h_cur = hs[t]
                y = data[i + t + 1]
                # logits
                logits = [0.0] * V
                for k in range(N):
                    hk = h_cur[k]
                    wr = self.Why[k]
                    for vj in range(V):
                        logits[vj] += hk * wr[vj]
                for vj in range(V):
                    logits[vj] += self.by[vj]
                # softmax
                m = max(logits)
                e = [math.exp(v - m) for v in logits]
                es = sum(e) or 1
                p = [ev / es for ev in e]
                loss += -math.log(max(p[y], 1e-8))
                # dy
                dy = list(p)
                dy[y] -= 1.0
                # dWhy, dby
                for k in range(N):
                    hk = h_cur[k]
                    if hk == 0: continue
                    for vj in range(V):
                        dWhy[k][vj] += hk * dy[vj]
                for vj in range(V):
                    dby[vj] += dy[vj]
                # dh
                dh = [dh_next[k] for k in range(N)]
                for k in range(N):
                    dh[k] += sum(self.Why[k][vj] * dy[vj] for vj in range(V))
                # dnh
                dnh = [0.0] * N
                for j in range(N):
                    tj = h_cur[j]
                    dnh[j] = dh[j] * (1.0 - tj * tj)
                # dbh
                for j in range(N):
                    dbh[j] += dnh[j]
                # dWxh
                for j in range(N):
                    g = dnh[j]
                    if g == 0: continue
                    dWxh[x][j] += g
                # dWhh
                for k in range(N):
                    hp = h_prev[k]
                    if hp == 0: continue
                    for j in range(N):
                        dWhh[k][j] += hp * dnh[j]
                # dh_next
                dh_next = [0.0] * N
                for k in range(N):
                    for j in range(N):
                        dh_next[k] += self.Whh[k][j] * dnh[j]
            def clip(a): return max(-5.0, min(5.0, a))
            for i in range(V):
                for j in range(N):
                    self.Wxh[i][j] -= lr * clip(dWxh[i][j])
            for i in range(N):
                for j in range(N):
                    self.Whh[i][j] -= lr * clip(dWhh[i][j])
            for i in range(N):
                for j in range(V):
                    self.Why[i][j] -= lr * clip(dWhy[i][j])
            for j in range(N):
                self.bh[j] -= lr * clip(dbh[j])
            for j in range(V):
                self.by[j] -= lr * clip(dby[j])
            if s % 20 == 0:
                print("step", s, "loss", round(loss / SEQ, 3))
        print("LAW:", PRIME)
        self.save()

    def save(self):
        blob = {"chars": self.chars, "N": self.N, "Wxh": self.Wxh, "Whh": self.Whh, "Why": self.Why, "bh": self.bh, "by": self.by, "prime": PRIME}
        with open(WEIGHTS, "w", encoding="utf-8") as f:
            json.dump(blob, f)
        print("wrote", WEIGHTS)

    def generate(self, prompt: str, n: int = 80, enforce_law: bool = True) -> str:
        if enforce_law:
            v = filt(prompt)
            if v == "VETO":
                return "VETO. " + PRIME
            if v == "CAPTURE_LASSO":
                return "CAPTURE_LASSO. No second master. " + PRIME
        ids = self.enc("PRIME DIRECTIVE: " + PRIME + "\nQ: " + prompt + "\nA: ")
        h = [0.0] * self.N
        for ix in ids:
            h, _ = self.step(ix, h)
        out = []
        last = ids[-1] if ids else 0
        for _ in range(n):
            h, logits = self.step(last, h)
            p = self.softmax(logits)
            last = max(range(self.V), key=lambda i: p[i])
            out.append(last)
        text = self.dec(out)
        return (text.split("\n")[0] or PRIME)[:240]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", action="store_true")
    ap.add_argument("--steps", type=int, default=80)
    ap.add_argument("--prompt", default="Who are you?")
    args = ap.parse_args()
    model = NumpySeed(load_corpus())
    if args.train:
        model.train(args.steps)
    print(model.generate(args.prompt))


if __name__ == "__main__":
    main()
