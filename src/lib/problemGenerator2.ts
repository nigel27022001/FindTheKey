import { randInt , shuffle } from "./randomUtils.ts";
interface DifficultyConfig {
    // number of attributes
    minAttr: number;
    maxAttr: number;
    transitiveLength: number;
    minCandidateKeySize: number;
    maxCandidateKeySize: number;    
    numberOfKeys: number;
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
const ATTR_POOL = "ABCDEFGHI".split("");


// Randomly selects a number of attributes and the candidate keys based on DifficultyConfig
function generateKey(cfg: DifficultyConfig): ProblemState  {
  const numAttr = randInt(cfg.minAttr, cfg.maxAttr);
  const attrs = ATTR_POOL.slice(0, numAttr);
  const keys: string[][] = [];
  for (let i = 0; i < cfg.numberOfKeys; i++) {
    const keySize = randInt(cfg.minCandidateKeySize, cfg.maxCandidateKeySize);
    const attrInds = shuffle(attrs);
    const key = attrInds.slice(0, keySize);
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

function generateGraph(keyAttrs: Set<string>, allAttrs: Set<string>): FDGraph {
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

    for (const nonKeyAttr of nonKeyAttrList) {
        // Pick a random node from the current frontier as the parent
        const parentId = frontier[randInt(0, frontier.length - 1)];
        const parent   = graph.get(parentId)!;

        parent.edges.add(nonKeyAttr);
        unassigned.delete(nonKeyAttr);

        // probability for a transitive chains?
        const becomesBridge = Math.random() < 0.90;
        if (becomesBridge) {
            graph.get(nonKeyAttr)!.role = "bridge";
            frontier.push(nonKeyAttr);   // now eligible to have outgoing edges
        }
    }

    const reachableFromKeys = computeReachable(graph, keyAttrs);

    for (const attr of nonKeyAttrs) {
        if (!reachableFromKeys.has(attr)) {
            // Attr is unreachable — connect it directly to a random keyAttr
            const keyAttr = keyAttrList[randInt(0, keyAttrList.length - 1)];
            graph.get(keyAttr)!.edges.add(attr);
        }
    }
    console.log(graph)
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
// suppress unused warning
void extractFDs;


function generateClosures(_cfg: DifficultyConfig, ProblemState: ProblemState) {
    console.log("ProblemState", ProblemState)
    for (const k of ProblemState.candidateKeys) {
        generateGraph(new Set(k), new Set(ProblemState.attributes))
    }
}


function generateProblem() {
    const config : DifficultyConfig = {
        minAttr: 6,
        maxAttr: 6,
        transitiveLength: 2,
        minCandidateKeySize: 1,
        maxCandidateKeySize: 3,
        numberOfKeys: 1
    }
    const ProblemState = generateKey(config)
    generateClosures(config, ProblemState)
    // generate closure for attributes based on the key
    
    // generate fds based on closure
}
generateProblem()

