import { randInt , shuffle } from "./randomUtils.ts";

interface DifficultyConfig extends CandidateKeyConfig, KeyAttrConfig, TransitiveConfig {
    // number of attributes
    minAttr: number;
    maxAttr: number;
    // number of functional dependencies 
    
    // number of candidateKeys - maybe users have to find all? 
    // size of candidate keys?
    // length of transitive chains
    
    // transitivity depth
    
    // Redundant FDs
        // either via transitive chains
        // Redundant RHS 
        // Redundant LHS
    
    // Overlapping candidate keys ?? 
    // Refer to the slides for example
}

interface KeyAttrConfig {
    maxLHSAttr: number; // possible number of attributes for FD. for eg: if 2, then possible fd {A, B} -> {C}
    numMultiKeyAttr: number;
}

interface TransitiveConfig {
    maxTransitiveLength: number;
    transitiveChains: number;
}

interface CandidateKeyConfig {
    minCandidateKeySize: number;
    maxCandidateKeySize: number;
    hasOverlappingAttrs: boolean;
    numCandidateKeys: number;
}

interface FdConfig {
    numRedundantRHS: number;
    numRedundantLHS: number;
}

const ATTR_POOL = "ABCDEFGHI".split("");


// Randomly selects a number of attributes and the candidate keys based on DifficultyConfig
function generateKey(cfg: DifficultyConfig): ProblemState  {
  const numAttr = randInt(cfg.minAttr, cfg.maxAttr);
  const attrs = ATTR_POOL.slice(0, numAttr);

  const keys: string[][] = [];
  var shuffledAttrs = shuffle([...attrs]);

  for (let i = 0; i < cfg.numCandidateKeys; i++) {
    const keySize = randInt(cfg.minCandidateKeySize, cfg.maxCandidateKeySize);
    const key = shuffledAttrs.slice(0, keySize);

    // account for non overlapping attributes
    if (!cfg.hasOverlappingAttrs) {
        shuffledAttrs = shuffledAttrs.slice(keySize + 1)
    }
    keys.push(key);
  }
  return {candidateKeys: keys, attributes: attrs}
}

type Attr = string;

interface ProblemState {
  candidateKeys: Attr[][];
  attributes: Attr[];
}

interface GraphNode {
    id: string;
    role: "key" | "nonKey" | "bridge";
    edges: Set<string>;        // outgoing edges (this attr determines these)
}

type FDGraph = Map<string, GraphNode>;

type FD = {
    lhs: string[];
    rhs: string[];
};


// ── Choose chain seed ──────────────────────────────────────────────
// Chain can start from:
//   (a) a keyAttr (always valid — guarantees reachability from key)
//   (b) an existing bridge node (creates shared-intermediate chains)
//
// For chain 0, always use keyAttr to guarantee at least one
// chain is rooted at a key.
function generateTransitiveChains(transitiveChains: number, 
    transitiveLength: number, 
    frontier: string[], 
    keyAttrList: string[], 
    nonKeyAttrList: string[],
    graph: FDGraph) {
    let freshCursor = 0; 

    for (let c = 0; c < transitiveChains; c++) {
        const existingBridges = frontier.filter(f => !keyAttrList.includes(f));
        const useExistingBridge = c > 0 && existingBridges.length > 0 && Math.random() < 0.5;       // 50% chance — tune via config

        let currentNode: string;
        if (useExistingBridge) {
            currentNode = existingBridges[randInt(0, existingBridges.length - 1)];
        } else {
            // Seed from a keyAttr (round-robin across keys)
            currentNode = keyAttrList[c % keyAttrList.length];
        }

        let chainLength = 0;
        while (chainLength < transitiveLength) {
            // At each step, decide: use existing bridge node OR fresh attr
            // if chose bridge from frontier -> then it needs to only chose from new attributes 
            // if currentNode tries to extend to an existing node, then we need to check the count for multitarget
            // if not currently a node in frontier 
            //      -> then can chose bridge from existing frontier, then need to subtract from the multi nodes
            //      -> else chose form new attribute 
            
            const availableBridgesAhead = frontier.filter(f =>
                f !== currentNode &&
                    !graph.get(currentNode)!.edges.has(f) === false  // not already connected
            );

            // only when taking a new node, then we connect to existing chain (else form redundant fd)
            const canExtendViaExisting = !useExistingBridge && availableBridgesAhead.length > 0 && Math.random() < 0.4;    // 40% chance to route through existing node
            let nextNode: string;

            if (canExtendViaExisting) {
                nextNode = availableBridgesAhead[randInt(0, availableBridgesAhead.length - 1)];
                graph.get(currentNode)!.edges.add(nextNode);

                // need to subtract from the multinode 

            } else {
                // Consume a fresh attr from the pool
                if (freshCursor >= nonKeyAttrList.length) break;   // pool exhausted
                nextNode = nonKeyAttrList[freshCursor++];

                graph.get(currentNode)!.edges.add(nextNode);
                const isLastStep = chainLength === transitiveLength - 1;
                if (!isLastStep) {
                    graph.get(nextNode)!.role = "bridge";
                    frontier.push(nextNode);
                }
            }

            currentNode = nextNode;
            chainLength++;
        }
    }

}

function generateGraph(keyAttrs: Set<string>, allAttrs: Set<string>, cfg: DifficultyConfig): FDGraph {
    const nonKeyAttrs = new Set([...allAttrs].filter(x => !keyAttrs.has(x)));
    const graph: FDGraph = new Map();

    for (const attr of allAttrs) {
        graph.set(attr, {
            id: attr,
            role: keyAttrs.has(attr) ? "key" : "nonKey",
            edges: new Set()
        });
    }

    const unassigned = new Set(nonKeyAttrs);
    const keyAttrList    = shuffle([...keyAttrs]);
    const nonKeyAttrList = shuffle([...nonKeyAttrs]);
    const frontier: string[] = [...keyAttrList];
    const unassignedAttrs = new Set<String>(nonKeyAttrs);
    
    var { numMultiKeyAttr, maxLHSAttr, transitiveChains, maxTransitiveLength } =  cfg

    // generate transitive chain
    generateTransitiveChains(transitiveChains, maxTransitiveLength, frontier, keyAttrList, nonKeyAttrList, graph)
    console.log("graph", graph)

    const multiCount   = Math.min(numMultiKeyAttr, nonKeyAttrList.length);
    const multiTargets = new Set(
        shuffle([...nonKeyAttrList]).slice(0, multiCount)
    );

    for (const nonKeyAttr of nonKeyAttrList) {
        const isMulti = multiTargets.has(nonKeyAttr);
        const numEdgesToAdd = isMulti
            ? randInt(2, Math.min(maxLHSAttr, frontier.length))  // at least 2 for multi
            : 1;

        const shuffledInds = shuffle(
            Array.from({ length: frontier.length }, (_, i) => i)
        );
        const selectedInds = shuffledInds.slice(0, numEdgesToAdd);

        for (const i of selectedInds) {
            // Pick a random node from the current frontier as the parent
            const parentId = frontier[i];
            const parent   = graph.get(parentId)!;
            parent.edges.add(nonKeyAttr);
        }

        unassigned.delete(nonKeyAttr);
        // probability for a transitive chains?
        const becomesBridge = Math.random() < 0.60;
        if (becomesBridge) {
            graph.get(nonKeyAttr)!.role = "bridge";
            frontier.push(nonKeyAttr);   // now eligible to have outgoing edges
        }
    }

    const reachableFromKeys = computeReachable(graph, keyAttrs);

    for (const attr of nonKeyAttrs) {
        if (!reachableFromKeys.has(attr)) {
            const keyAttr = keyAttrList[randInt(0, keyAttrList.length - 1)];
            graph.get(keyAttr)!.edges.add(attr);
        }
    }

    console.log("graph", graph)
    return graph;
}

// ── BFS reachability from a set of start nodes ──────────────────────────────
function computeReachable(graph: FDGraph, startNodes: Set<string>): Set<string> {
    const visited = new Set<string>();
    const queue   = [...startNodes];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        for (const neighbour of graph.get(current)?.edges ?? []) {
            if (!visited.has(neighbour)) queue.push(neighbour);
        }
    }

    return visited;
}

// ── Read FDs off the graph ───────────────────────────────────────────────────
function extractFDs(graph: FDGraph): FD[] {
    const fds: FD[] = [];
    for (const [nodeId, node] of graph) {
        if (node.edges.size > 0) {
            fds.push({ lhs: [nodeId], rhs: [...node.edges] });
        }
    }
    return fds;
}


function generateClosures(cfg: DifficultyConfig, problemState: ProblemState) {
    console.log("ProblemState", problemState)
    const {candidateKeys, attributes} = problemState;
    generateGraph(new Set(candidateKeys[0]), new Set(attributes), cfg);
}


function generateProblem() {
    const config : DifficultyConfig = {
        minAttr: 6,
        maxAttr: 6,
        minCandidateKeySize: 2,
        maxCandidateKeySize: 2,
        numCandidateKeys: 1,
        hasOverlappingAttrs: false,
        maxLHSAttr: 2,
        numMultiKeyAttr: 2,
        maxTransitiveLength: 2,
        transitiveChains: 2
    }
    const ProblemState = generateKey(config)
    generateClosures(config, ProblemState)
    // generate closure for attributes based on the key
    
    // generate fds based on closure
}
generateProblem()

