import { describe, it, expect } from 'vitest';
import type { FD } from './fdAlgorithms';
import {
  computeClosure,
  isSuperkey,
  isCandidateKey,
  findAllCandidateKeys,
  arraysEqual,
} from './fdAlgorithms';

describe('fdAlgorithms', () => {

  describe('computeClosure', () => {
    it('should compute the correct attribute closure', () => {
      // Schema: R(A, B, C, D)
      // FDs: A -> B, B -> C
      const fds: FD[] = [
        { lhs: ['A'], rhs: ['B'] },
        { lhs: ['B'], rhs: ['C'] },
      ];

      const closureA = computeClosure(['A'], fds);
      expect(closureA.has('A')).toBe(true);
      expect(closureA.has('B')).toBe(true);
      expect(closureA.has('C')).toBe(true);
      expect(closureA.has('D')).toBe(false);

      const closureB = computeClosure(['B'], fds);
      expect(closureB.has('A')).toBe(false);
      expect(closureB.has('B')).toBe(true);
      expect(closureB.has('C')).toBe(true);

      // Trivial closure
      const closureD = computeClosure(['D'], fds);
      expect(closureD.has('D')).toBe(true);
      expect(closureD.size).toBe(1);
    });

    it('should handle complex closures with multi-attribute LHS', () => {
      // FDs: AB -> C, C -> D
      const fds: FD[] = [
        { lhs: ['A', 'B'], rhs: ['C'] },
        { lhs: ['C'], rhs: ['D'] },
      ];

      const closureAB = computeClosure(['A', 'B'], fds);
      expect(closureAB.has('A')).toBe(true);
      expect(closureAB.has('B')).toBe(true);
      expect(closureAB.has('C')).toBe(true);
      expect(closureAB.has('D')).toBe(true);

      const closureA = computeClosure(['A'], fds);
      expect(closureA.size).toBe(1); // just A
    });
  });

  describe('isSuperkey', () => {
    it('should correctly identify superkeys', () => {
      const allAttrs = ['A', 'B', 'C', 'D'];
      const fds: FD[] = [
        { lhs: ['A'], rhs: ['B', 'C', 'D'] },
      ];

      expect(isSuperkey(['A'], allAttrs, fds)).toBe(true);
      expect(isSuperkey(['A', 'B'], allAttrs, fds)).toBe(true); // superset of a key is a superkey
      expect(isSuperkey(['B', 'C'], allAttrs, fds)).toBe(false);
    });
  });

  describe('isCandidateKey', () => {
    it('should correctly identify candidate keys (minimal superkeys)', () => {
      const allAttrs = ['A', 'B', 'C', 'D'];
      const fds: FD[] = [
        { lhs: ['A'], rhs: ['B', 'C', 'D'] },
        { lhs: ['B', 'C'], rhs: ['A'] },
      ];

      // A is a superkey and minimal
      expect(isCandidateKey(['A'], allAttrs, fds)).toBe(true);

      // {A, B} is a superkey but NOT minimal (since A is a key)
      expect(isCandidateKey(['A', 'B'], allAttrs, fds)).toBe(false);

      // {B, C} is a superkey and minimal
      expect(isCandidateKey(['B', 'C'], allAttrs, fds)).toBe(true);
    });
    it('Multiple Candidate Keys', () => {
      const allAttrs = ['A', 'B', 'C', 'D'];
      const fds: FD[] = [
        { lhs: ['A'], rhs: ['B'] },
        { lhs: ['B'], rhs: ['A'] },
        { lhs: ['A'], rhs: ['C', 'D'] },
      ];

      // Candidate keys should be {A} and {B}
      const keys = findAllCandidateKeys(allAttrs, fds);
      expect(keys.length).toBe(2);

      expect(isCandidateKey(['A'], allAttrs, fds)).toBe(true);
      expect(isCandidateKey(['B'], allAttrs, fds)).toBe(true);

      const keyStrings = keys.map(k => k.join(',')).sort();
      expect(keyStrings).toEqual(['A', 'B']);
    });
  });

  describe('findAllCandidateKeys', () => {
    it('should find all candidate keys in a relation', () => {
      const allAttrs = ['A', 'B', 'C', 'D'];
      const fds: FD[] = [
        { lhs: ['A'], rhs: ['B'] },
        { lhs: ['B'], rhs: ['A'] },
        { lhs: ['A'], rhs: ['C', 'D'] },
      ];

      // Candidate keys should be {A} and {B}
      const keys = findAllCandidateKeys(allAttrs, fds);
      expect(keys.length).toBe(2);

      const keyStrings = keys.map(k => k.join(',')).sort();
      expect(keyStrings).toEqual(['A', 'B']);
    });
  });

  describe('arraysEqual', () => {
    it('should check if two arrays are equal regardless of order', () => {
      expect(arraysEqual(['A', 'B'], ['B', 'A'])).toBe(true);
      expect(arraysEqual(['A', 'B'], ['A', 'B'])).toBe(true);
      expect(arraysEqual(['A'], ['A', 'B'])).toBe(false);
      expect(arraysEqual(['A', 'C'], ['A', 'B'])).toBe(false);
    });
  });

});
