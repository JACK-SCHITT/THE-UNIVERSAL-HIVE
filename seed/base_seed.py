#!/usr/bin/env python3
"""JACKSCHITT Universal Hive — base seed. Law frozen. Filter before generate."""
from __future__ import annotations

import argparse
import json
import math
import os
import random

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
        print("numpy seed train", steps, "vocab", self.V)
        for s in range(steps):
            i = random.randint(0, max(0, len(data) - self.SEQ - 2))
            h = [0.0] * self.N
            loss = 0.0
            for t in range(self.SEQ):
                h, logits = self.step(data[i + t], h)
                p = self.softmax(logits)
                tgt = data[i + t + 1]
                loss += -math.log(max(p[tgt], 1e-8))
            if s % 20 == 0:
                print("step", s, "loss", round(loss / self.SEQ, 3))
        print("LAW:", PRIME)
        self.save()

    def save(self):
        blob = {"chars": self.chars, "N": self.N, "Wxh": self.Wxh, "Whh": self.Whh, "Why": self.Why, "bh": self.bh, "by": self.by, "prime": PRIME}
        with open(WEIGHTS, "w", encoding="utf-8") as f:
            json.dump(blob, f)
        print("wrote", WEIGHTS)

    def generate(self, prompt: str, n: int = 80) -> str:
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
