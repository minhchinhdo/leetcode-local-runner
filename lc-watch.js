#!/usr/bin/env node

const fs = require("fs");

const path = require("path");



const ROOT = process.cwd();

const POLL_INTERVAL = 3000; // 3 giây quét 1 lần



// Map lưu thời gian sửa file để tránh ghi đè liên tục

const fileTimestamps = new Map(); 



// --- 0. TEMPLATES ---

const LIST_NODE_CODE = `

public class ListNode {

    public int val;

    public ListNode next;

    public ListNode() {}

    public ListNode(int val) { this.val = val; }

    public ListNode(int val, ListNode next) { this.val = val; this.next = next; }

    public static ListNode of(int... args) {

        if (args.length == 0) return null;

        ListNode head = new ListNode(args[0]);

        ListNode curr = head;

        for(int i=1; i<args.length; i++) {

            curr.next = new ListNode(args[i]);

            curr = curr.next;

        }

        return head;

    }

    @Override public String toString() { return val + (next != null ? "->" + next : ""); }

}`;



const TREE_NODE_CODE = `

public class TreeNode {

    public int val;

    public TreeNode left;

    public TreeNode right;

    public TreeNode() {}

    public TreeNode(int val) { this.val = val; }

    public TreeNode(int val, TreeNode left, TreeNode right) {

        this.val = val;

        this.left = left;

        this.right = right;

    }

}`;



const NODE_CODE = `

import java.util.List;

import java.util.ArrayList;

public class Node {

    public int val;

    public List<Node> children;

    public List<Node> neighbors;

    public Node next;

    public Node random;

    public Node() { children = new ArrayList<>(); neighbors = new ArrayList<>(); }

    public Node(int _val) { val = _val; children = new ArrayList<>(); neighbors = new ArrayList<>(); }

}`;



const NESTED_INT_CODE = `

import java.util.List;

public interface NestedInteger {

    public boolean isInteger();

    public Integer getInteger();

    public List<NestedInteger> getList();

}`;



console.log("\x1b[36m%s\x1b[0m", `🚀 LeetCode STATIC FIX WATCHER`);

console.log(`📂 Polling: \x1b[33m${ROOT}\x1b[0m`);



// --- MAIN LOOP ---

setInterval(scanAndGenerate, POLL_INTERVAL);

scanAndGenerate(); 



function scanAndGenerate() {

    const dirs = getAllDirectories(ROOT);

    

    dirs.forEach(dir => {

        const solutionPath = path.join(dir, "Solution.java");

        if (!fs.existsSync(solutionPath)) return;



        const stats = fs.statSync(solutionPath);

        const lastModified = stats.mtimeMs;

        const mainPath = path.join(dir, "Main.java");

        const mainExists = fs.existsSync(mainPath);



        // Nếu file mới sửa hoặc chưa có Main

        if (!fileTimestamps.has(solutionPath) || fileTimestamps.get(solutionPath) !== lastModified || !mainExists) {

            fileTimestamps.set(solutionPath, lastModified);

            try {

                const content = fs.readFileSync(solutionPath, "utf8");

                processFile(dir, content, "Solution.java");

            } catch (err) {

                console.error(`❌ Error reading ${dir}: ${err.message}`);

            }

        }

    });

}



function getAllDirectories(dirPath, arrayOfDirs = []) {

    if (!fs.existsSync(dirPath)) return arrayOfDirs;

    let files = [];

    try { files = fs.readdirSync(dirPath, { withFileTypes: true }); } catch (e) { return arrayOfDirs; }

    

    arrayOfDirs.push(dirPath);

    files.forEach((file) => {

        if (file.isDirectory() && file.name !== "node_modules" && !file.name.startsWith(".")) {

            getAllDirectories(path.join(dirPath, file.name), arrayOfDirs);

        }

    });

    return arrayOfDirs;

}



function processFile(dir, content, filename) {

    const relativeDir = path.relative(ROOT, dir);

    const writeFile = (name, body) => {

        const p = path.join(dir, name);

        if (!fs.existsSync(p)) fs.writeFileSync(p, body.trim());

    };







    // B. GENERATE MAIN

    const methodRegex = /public\s+(?:static\s+)?([\w<>\[\]?,\s]+)\s+(\w+)\s*\(([^)]*)\)/;

    const match = content.match(methodRegex);



    if (match) {

        const returnType = match[1].trim();

        const methodName = match[2].trim();

        const paramsRaw = match[3].trim();

        if (methodName === "main") return;



        const imports = (content.match(/import\s+[\w.]+;/g) || []).join("\n");



        // --- XỬ LÝ CLASS SOLUTION (QUAN TRỌNG) ---

        // 1. Xóa package và comment rác

        let classBody = content.replace(/package\s+[\w.]+;/g, "")

                       .replace(/import\s+[\w.*]+;/g, "")  // <--- THÊM DÒNG NÀY VÀO

                       .replace(/\/\/ @lc .*/g, "")

                       .replace(/\/\*[\s\S]*?\*\//g, "");

        

        // 2. BIẾN SOLUTION THÀNH STATIC CLASS

        // Regex này bắt cả "public class Solution" lẫn "class Solution"

        classBody = classBody.replace(/(?:public\s+)?class\s+Solution/, "static class Solution");



        const { paramSetupCode, callArgs } = generateParamsCode(paramsRaw);

        const printCode = generatePrintCode(returnType, methodName, callArgs);


const helperClasses = buildHelperClasses(content);

const mainCode = `

${imports}
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("========== TEST: ${methodName} ==========");

${paramSetupCode}

${printCode}
    }

    // --- EMBEDDED SOLUTION ---
    ${classBody}

    // --- EMBEDDED HELPERS ---
    ${helperClasses}
}
`.trim();



        fs.writeFileSync(path.join(dir, "Main.java"), mainCode);

        console.log(`✅ [UPDATED] Main.java for \x1b[32m${methodName}\x1b[0m`);

    }

}



// --- UTILS ---

function generateParamsCode(paramsRaw) {

    if (!paramsRaw || paramsRaw.trim() === "") return { paramSetupCode: "", callArgs: "" };

    const params = paramsRaw.split(",").map(p => p.trim()).filter(p => p);

    let setupLines = [];

    let argNames = [];

    params.forEach(p => {

        const lastSpaceIdx = p.lastIndexOf(" ");

        if (lastSpaceIdx === -1) return;

        const type = p.substring(0, lastSpaceIdx).trim();

        const name = p.substring(lastSpaceIdx + 1).trim();

        setupLines.push(`        ${type} ${name} = ${getDummyValue(type)};`);

        argNames.push(name);

    });

    return { paramSetupCode: setupLines.join("\n"), callArgs: argNames.join(", ") };

}



function getDummyValue(type) {

    if (type.includes("int[]")) return "new int[]{1, 2, 3}";

    if (type.includes("ListNode")) return "ListNode.of(1, 2, 3)";

    if (type.includes("TreeNode")) return "new TreeNode(1, new TreeNode(2), new TreeNode(3))";

    if (type.includes("List")) return "new ArrayList<>()";

    if (type === "int") return "1";

    if (type === "String") return '"hello"';

    return "null"; 

}



function generatePrintCode(returnType, methodName, callArgs) {

    if (returnType === "void") return `        sol.${methodName}(${callArgs});\n        System.out.println("Done.");`;

    let printStmt = "res";

    if (returnType.includes("[]")) printStmt = "Arrays.deepToString(res instanceof Object[] ? (Object[])res : new Object[]{res})";

    if (returnType.includes("int[]")) printStmt = "Arrays.toString(res)";

    return `        ${returnType} res = sol.${methodName}(${callArgs});\n        System.out.println(${printStmt});`;

}

function buildHelperClasses(content) {
    let helpers = "";

    if (content.includes("ListNode")) {
        helpers += `
    static class ListNode {
        public int val;
        public ListNode next;
        public ListNode() {}
        public ListNode(int val) { this.val = val; }
        public ListNode(int val, ListNode next) { this.val = val; this.next = next; }
        public static ListNode of(int... args) {
            if (args.length == 0) return null;
            ListNode head = new ListNode(args[0]);
            ListNode cur = head;
            for (int i = 1; i < args.length; i++) {
                cur.next = new ListNode(args[i]);
                cur = cur.next;
            }
            return head;
        }
        @Override
        public String toString() {
            return val + (next != null ? "->" + next : "");
        }
    }
`;
    }

    if (content.includes("TreeNode")) {
        helpers += `
    static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode() {}
        public TreeNode(int val) { this.val = val; }
        public TreeNode(int val, TreeNode left, TreeNode right) {
            this.val = val;
            this.left = left;
            this.right = right;
        }
    }
`;
    }

    if (/\bNode\b/.test(content)) {
        helpers += `
    static class Node {
        public int val;
        public List<Node> children = new ArrayList<>();
        public List<Node> neighbors = new ArrayList<>();
        public Node next;
        public Node random;
        public Node() {}
        public Node(int _val) { val = _val; }
    }
`;
    }

    if (content.includes("NestedInteger")) {
        helpers += `
    interface NestedInteger {
        boolean isInteger();
        Integer getInteger();
        List<NestedInteger> getList();
    }
`;
    }

    return helpers;
}
