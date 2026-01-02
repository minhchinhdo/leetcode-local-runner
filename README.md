# LeetCode Local Runner

[![NPM Version](https://img.shields.io/npm/v/leetcode-local-runner.svg)](https://www.npmjs.com/package/leetcode-local-runner)
[![Node Version](https://img.shields.io/node/v/leetcode-local-runner.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cross-platform CLI tool to automatically compile and run **LeetCode Java solutions** locally without modifying your `Solution.java` file.

> Write code like you do on LeetCode → get instant results on your machine.

---

## ✨ Features

-   **File Watching**: Automatically detects changes in any `Solution.java` file.
-   **Code Generation**: Automatically generates a runnable `Main.java` file.
-   **Smart Parsing**: Detects the solution method name and its parameters.
-   **Classpath-Free**: Embeds your `Solution` class into a `Main` class to avoid classpath issues.
-   **Helper Classes**: Automatically includes common helper classes like `ListNode` and `TreeNode`.
-   **Cross-Platform**: Works on **Windows, Ubuntu, and macOS**.
-   **Stable Polling**: Uses a reliable polling mechanism to watch for file changes.

---

## 📦 Installation

You can install the tool globally via npm, which is the recommended approach.

```bash
npm install -g leetcode-local-runner
```

Alternatively, you can install it as a development dependency in your project:

```bash
npm install --save-dev leetcode-local-runner
```

---

## 🚀 Usage

1.  Open your terminal or command prompt.
2.  Navigate to the directory containing your LeetCode problem folders (each with a `Solution.java`).
3.  Run the following command:

    ```bash
    leetcode-watch
    ```

4.  The tool will start watching for file modifications. Every time you save a `Solution.java` file, it will automatically:
    -   Generate a new `Main.java` in the same directory.
    -   Compile and run `Main.java` to show you the output.

Now you can focus on writing your solution and see the results instantly!

---

## 🔧 How It Works

The script works by parsing your `Solution.java` file to understand its structure. It then generates a complete, runnable `Main.java` file that wraps your code.

For example, if your `Solution.java` is:

```java
// Solution.java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here...
    }
}
```

The tool will generate a `Main.java` file like this:

```java
// Main.java (Auto-generated)
import java.util.*;

public class Main {
    // Helper classes like ListNode or TreeNode are automatically injected here if needed.

    static class Solution {
        // Your entire Solution.java code is placed here.
        public int[] twoSum(int[] nums, int target) {
            // Your code here...
        }
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        
        // Dummy data is used to call your method.
        // (Note: The dummy data is hardcoded in the script for now)
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] result = sol.twoSum(nums, target);
        
        System.out.println(Arrays.toString(result));
    }
}
```

This design means you don't have to worry about managing classpaths or writing a `main` method just for testing.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open a Pull Request or an Issue to discuss any changes.

## 📄 License

This project is licensed under the [MIT License](LICENSE).