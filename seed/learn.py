#!/usr/bin/env python3
"""Dependency-free example learner for hive agents. Nearest-centroid + k-NN, persisted."""

from __future__ import annotations

import json
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(HERE, "memory", "employee_alpha_learn.json")


def _clean_label(y) -> str:
    return re.sub(r"\s+", " ", str(y)).strip() or "unlabeled"


def _clean_x(x) -> list:
    if not isinstance(x, (list, tuple)) or not x:
        raise ValueError("x must be a non-empty list of numbers")
    out = []
    for v in x:
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            raise ValueError("every feature must be a number")
        out.append(float(v))
    return out


def _dist(a, b) -> float:
    return math.sqrt(sum((p - q) ** 2 for p, q in zip(a, b)))


class Learner:
    def __init__(self, path: str = STORE):
        self.path = path
        self.examples: list[dict] = []
        self.load()

    def load(self) -> "Learner":
        if self.path and os.path.isfile(self.path):
            try:
                with open(self.path, encoding="utf-8") as f:
                    data = json.load(f)
                self.examples = data if isinstance(data, list) else data.get("examples", [])
            except Exception:
                self.examples = []
        return self

    def save(self) -> None:
        if not self.path:
            return
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.examples, f, indent=2)

    def add(self, x, y) -> dict:
        row = {"x": _clean_x(x), "y": _clean_label(y)}
        self.examples.append(row)
        self.save()
        return row

    def train(self, rows) -> dict:
        for r in rows:
            if isinstance(r, dict):
                self.add(r.get("x"), r.get("y"))
            else:
                self.add(r[0], r[1])
        return self.stats()

    def centroids(self) -> dict:
        bucket: dict[str, list[list[float]]] = {}
        for e in self.examples:
            bucket.setdefault(e["y"], []).append(e["x"])
        return {label: [sum(col) / len(col) for col in zip(*vecs)]
                for label, vecs in bucket.items()}

    def predict(self, x):
        if not self.examples:
            return None
        xv = _clean_x(x)
        cents = self.centroids()
        return min(cents, key=lambda label: _dist(xv, cents[label]))

    def predict_knn(self, x, k: int = 3):
        if not self.examples:
            return None
        xv = _clean_x(x)
        ranked = sorted(self.examples, key=lambda e: _dist(xv, e["x"]))[:max(1, k)]
        votes: dict[str, int] = {}
        for e in ranked:
            votes[e["y"]] = votes.get(e["y"], 0) + 1
        return max(votes, key=lambda label: (votes[label], -len(label)))

    def classes(self) -> list:
        return sorted({e["y"] for e in self.examples})

    def reset(self) -> None:
        self.examples = []
        self.save()

    def stats(self) -> dict:
        return {"examples": len(self.examples), "classes": self.classes(),
                "features": len(self.examples[0]["x"]) if self.examples else 0}


if __name__ == "__main__":
    X = [[100, 2], [150, 5], [300, 10], [500, 15]]
    y = ["Small", "Small", "Large", "Large"]
    L = Learner(path=os.path.join(HERE, "memory", "demo_learn.json"))
    L.reset()
    for xi, yi in zip(X, y):
        L.add(xi, yi)
    print("stats  ", L.stats())
    print("[500,15]", L.predict([500, 15]))
    print("[120,3] ", L.predict([120, 3]))