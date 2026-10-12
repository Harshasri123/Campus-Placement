/**
 * Authentic Campus Recruitment Coding Problems Pool
 * Tagged by Company (TCS NQT, Infosys DSE, Cognizant, Wipro, Accenture)
 * Complete with starter code (Python, Java, C, C++, JS), sample test cases, and hidden edge cases.
 */

const CODING_PROBLEMS = [
  {
    id: 'tcs-adv-1',
    title: 'Subarray with Given Sum',
    company: 'TCS NQT',
    difficulty: 'Medium',
    category: 'Arrays & Two Pointers',
    timeLimitSeconds: 2.0,
    memoryLimitMB: 256,
    description: `Given an unsorted array \`A\` of size \`N\` of non-negative integers, find a continuous sub-array that adds to a given number \`S\`.

In case of multiple subarrays, return the 1-based indices of the start and end positions of the FIRST such occurring subarray. If no such subarray exists, print \`-1\`.`,
    inputFormat: `Line 1: Two space-separated integers N and S.\nLine 2: N space-separated integers representing array elements.`,
    outputFormat: `Print the 1-based start and end indices space-separated, or -1.`,
    constraints: `1 <= N <= 10^5\n0 <= A[i] <= 10^4\n1 <= S <= 10^9`,
    sampleTestCases: [
      {
        input: `5 12\n1 2 3 7 5`,
        expectedOutput: `2 4`,
        explanation: `The sum of elements from 2nd position to 4th position is 2 + 3 + 7 = 12.`
      },
      {
        input: `10 15\n1 2 3 4 5 6 7 8 9 10`,
        expectedOutput: `1 5`,
        explanation: `Sum from 1st to 5th position is 1 + 2 + 3 + 4 + 5 = 15.`
      }
    ],
    hiddenTestCases: [
      {
        input: `4 0\n1 2 3 4`,
        expectedOutput: `-1`,
        isHidden: true
      },
      {
        input: `6 33\n1 4 20 3 10 5`,
        expectedOutput: `3 5`,
        isHidden: true
      },
      {
        input: `5 5\n0 0 0 5 0`,
        expectedOutput: `1 4`,
        isHidden: true
      }
    ],
    starterCode: {
      python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    s = int(lines[1])
    arr = [int(x) for x in lines[2:2+n]]
    
    # Write your solution here
    curr_sum = 0
    start = 0
    for end in range(n):
        curr_sum += arr[end]
        while curr_sum > s and start < end:
            curr_sum -= arr[start]
            start += 1
        if curr_sum == s:
            print(f"{start + 1} {end + 1}")
            return
            
    print("-1")

if __name__ == '__main__':
    solve()`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long s = sc.nextLong();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextLong();
        }
        
        // Write your solution here
        long currSum = 0;
        int start = 0;
        for (int end = 0; end < n; end++) {
            currSum += arr[end];
            while (currSum > s && start < end) {
                currSum -= arr[start++];
            }
            if (currSum == s) {
                System.out.println((start + 1) + " " + (end + 1));
                return;
            }
        }
        System.out.println("-1");
    }
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long s;
    if (!(cin >> n >> s)) return 0;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    // Write your solution here
    long long curr = 0;
    int start = 0;
    for (int end = 0; end < n; end++) {
        curr += arr[end];
        while (curr > s && start < end) {
            curr -= arr[start++];
        }
        if (curr == s) {
            cout << (start + 1) << " " << (end + 1) << endl;
            return 0;
        }
    }
    cout << "-1" << endl;
    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    int n;
    long long s;
    if (scanf("%d %lld", &n, &s) != 2) return 0;
    long long arr[100005];
    for (int i = 0; i < n; i++) scanf("%lld", &arr[i]);
    
    long long curr = 0;
    int start = 0;
    for (int end = 0; end < n; end++) {
        curr += arr[end];
        while (curr > s && start < end) {
            curr -= arr[start++];
        }
        if (curr == s) {
            printf("%d %d\\n", start + 1, end + 1);
            return 0;
        }
    }
    printf("-1\\n");
    return 0;
}`
    }
  },
  {
    id: 'inf-dse-1',
    title: 'Valid Parentheses & Depth',
    company: 'Infosys (DSE)',
    difficulty: 'Easy to Medium',
    category: 'Stacks & Strings',
    timeLimitSeconds: 2.0,
    memoryLimitMB: 256,
    description: `Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid and print the maximum nested depth.

An input string is valid if:
1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

If valid, output: \`VALID <max_depth>\`. If invalid, output \`INVALID\`. An empty valid string has depth 0.`,
    inputFormat: `A single line containing the bracket string S.`,
    outputFormat: `Print 'VALID <depth>' or 'INVALID'.`,
    constraints: `1 <= length of S <= 10^5`,
    sampleTestCases: [
      {
        input: `{[()]}`,
        expectedOutput: `VALID 3`,
        explanation: `Nested depth: '{' (depth 1), '[' (depth 2), '(' (depth 3). Max depth is 3.`
      },
      {
        input: `()[]{}`,
        expectedOutput: `VALID 1`,
        explanation: `All pairs are valid at depth 1.`
      }
    ],
    hiddenTestCases: [
      {
        input: `([)]`,
        expectedOutput: `INVALID`,
        isHidden: true
      },
      {
        input: `((({})))`,
        expectedOutput: `VALID 4`,
        isHidden: true
      },
      {
        input: `))((`,
        expectedOutput: `INVALID`,
        isHidden: true
      }
    ],
    starterCode: {
      python: `import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        print("VALID 0")
        return
        
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    max_depth = 0
    
    for ch in s:
        if ch in '({[':
            stack.append(ch)
            if len(stack) > max_depth:
                max_depth = len(stack)
        elif ch in ')}]':
            if not stack or stack[-1] != pairs[ch]:
                print("INVALID")
                return
            stack.pop()
            
    if not stack:
        print(f"VALID {max_depth}")
    else:
        print("INVALID")

if __name__ == '__main__':
    solve()`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNext() ? sc.next().trim() : "";
        if (s.isEmpty()) {
            System.out.println("VALID 0");
            return;
        }
        
        Stack<Character> stack = new Stack<>();
        int maxDepth = 0;
        
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
                if (stack.size() > maxDepth) maxDepth = stack.size();
            } else if (c == ')' || c == '}' || c == ']') {
                if (stack.isEmpty()) {
                    System.out.println("INVALID");
                    return;
                }
                char top = stack.pop();
                if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {
                    System.out.println("INVALID");
                    return;
                }
            }
        }
        if (stack.isEmpty()) {
            System.out.println("VALID " + maxDepth);
        } else {
            System.out.println("INVALID");
        }
    }
}`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) {
        cout << "VALID 0" << endl;
        return 0;
    }
    stack<char> st;
    int maxDepth = 0;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
            if ((int)st.size() > maxDepth) maxDepth = st.size();
        } else if (c == ')' || c == '}' || c == ']') {
            if (st.empty()) {
                cout << "INVALID" << endl;
                return 0;
            }
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {
                cout << "INVALID" << endl;
                return 0;
            }
        }
    }
    if (st.empty()) cout << "VALID " << maxDepth << endl;
    else cout << "INVALID" << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[100005];
    if (scanf("%s", s) != 1) {
        printf("VALID 0\\n");
        return 0;
    }
    char stack[100005];
    int top = 0;
    int maxDepth = 0;
    int len = strlen(s);
    for (int i = 0; i < len; i++) {
        char c = s[i];
        if (c == '(' || c == '{' || c == '[') {
            stack[top++] = c;
            if (top > maxDepth) maxDepth = top;
        } else if (c == ')' || c == '}' || c == ']') {
            if (top == 0) {
                printf("INVALID\\n");
                return 0;
            }
            char open = stack[--top];
            if ((c == ')' && open != '(') || (c == '}' && open != '{') || (c == ']' && open != '[')) {
                printf("INVALID\\n");
                return 0;
            }
        }
    }
    if (top == 0) printf("VALID %d\\n", maxDepth);
    else printf("INVALID\\n");
    return 0;
}`
    }
  },
  {
    id: 'cts-genc-1',
    title: 'Character Frequency Compression',
    company: 'Cognizant',
    difficulty: 'Easy',
    category: 'Strings & Hashing',
    timeLimitSeconds: 2.0,
    memoryLimitMB: 256,
    description: `Given a string consisting of lowercase English letters, compress the string such that each consecutive run of identical characters is replaced by the character followed by the count of repetitions.

If the count is 1, still include '1' (e.g. "a" -> "a1"). Output the compressed string in sorted alphabetical order of characters with their aggregated total counts.`,
    inputFormat: `A single line containing the input string.`,
    outputFormat: `Print the alphabetical frequency compressed string.`,
    constraints: `1 <= length <= 10^5`,
    sampleTestCases: [
      {
        input: `aabcccccaaa`,
        expectedOutput: `a5b1c5`,
        explanation: `Total counts: a appears 5 times, b appears 1 time, c appears 5 times.`
      },
      {
        input: `cognizant`,
        expectedOutput: `a1c1g1i1n2o1t1z1`,
        explanation: `Frequencies sorted alphabetically.`
      }
    ],
    hiddenTestCases: [
      {
        input: `zzzz`,
        expectedOutput: `z4`,
        isHidden: true
      },
      {
        input: `ba`,
        expectedOutput: `a1b1`,
        isHidden: true
      }
    ],
    starterCode: {
      python: `import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
        
    res = "".join(f"{c}{freq[c]}" for c in sorted(freq.keys()))
    print(res)

if __name__ == '__main__':
    solve()`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next().trim();
        int[] freq = new int[26];
        for (char c : s.toCharArray()) {
            if (c >= 'a' && c <= 'z') freq[c - 'a']++;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 26; i++) {
            if (freq[i] > 0) {
                sb.append((char)('a' + i)).append(freq[i]);
            }
        }
        System.out.println(sb.toString());
    }
}`,
      cpp: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) return 0;
    vector<int> freq(26, 0);
    for (char c : s) if (c >= 'a' && c <= 'z') freq[c - 'a']++;
    string res = "";
    for (int i = 0; i < 26; i++) {
        if (freq[i] > 0) {
            res += (char)('a' + i) + to_string(freq[i]);
        }
    }
    cout << res << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[100005];
    if (scanf("%s", s) != 1) return 0;
    int freq[26] = {0};
    int len = strlen(s);
    for (int i = 0; i < len; i++) {
        if (s[i] >= 'a' && s[i] <= 'z') freq[s[i] - 'a']++;
    }
    for (int i = 0; i < 26; i++) {
        if (freq[i] > 0) {
            printf("%c%d", 'a' + i, freq[i]);
        }
    }
    printf("\\n");
    return 0;
}`
    }
  },
  {
    id: 'wipro-nth-1',
    title: 'Peak Element in Array',
    company: 'Wipro',
    difficulty: 'Easy',
    category: 'Binary Search',
    timeLimitSeconds: 2.0,
    memoryLimitMB: 256,
    description: `An element is called a peak element if its value is not smaller than the value of its adjacent elements (if they exist).

Given an array of integers \`arr[]\` of size \`N\`, find the index (0-based) of any peak element in the array. If there are multiple peak elements, output the peak element's VALUE.`,
    inputFormat: `Line 1: An integer N representing array size.\nLine 2: N space-separated integers.`,
    outputFormat: `Print the value of the peak element.`,
    constraints: `1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9`,
    sampleTestCases: [
      {
        input: `3\n1 2 3`,
        expectedOutput: `3`,
        explanation: `Element 3 is strictly greater than its left neighbor 2, and right neighbor does not exist.`
      },
      {
        input: `4\n1 2 1 3`,
        expectedOutput: `2`,
        explanation: `Element 2 is greater than 1 and 1.`
      }
    ],
    hiddenTestCases: [
      {
        input: `1\n42`,
        expectedOutput: `42`,
        isHidden: true
      },
      {
        input: `5\n5 4 3 2 1`,
        expectedOutput: `5`,
        isHidden: true
      }
    ],
    starterCode: {
      python: `import sys

def solve():
    nums = [int(x) for x in sys.stdin.read().split()]
    if not nums:
        return
    n = nums[0]
    arr = nums[1:1+n]
    if n == 1:
        print(arr[0])
        return
    for i in range(n):
        left_ok = (i == 0 or arr[i] >= arr[i - 1])
        right_ok = (i == n - 1 or arr[i] >= arr[i + 1])
        if left_ok and right_ok:
            print(arr[i])
            return

if __name__ == '__main__':
    solve()`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
        
        if (n == 1) {
            System.out.println(arr[0]);
            return;
        }
        for (int i = 0; i < n; i++) {
            boolean left = (i == 0 || arr[i] >= arr[i - 1]);
            boolean right = (i == n - 1 || arr[i] >= arr[i + 1]);
            if (left && right) {
                System.out.println(arr[i]);
                return;
            }
        }
    }
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    if (n == 1) {
        cout << arr[0] << endl;
        return 0;
    }
    for (int i = 0; i < n; i++) {
        bool left = (i == 0 || arr[i] >= arr[i - 1]);
        bool right = (i == n - 1 || arr[i] >= arr[i + 1]);
        if (left && right) {
            cout << arr[i] << endl;
            return 0;
        }
    }
    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    long long arr[100005];
    for (int i = 0; i < n; i++) scanf("%lld", &arr[i]);
    if (n == 1) {
        printf("%lld\\n", arr[0]);
        return 0;
    }
    for (int i = 0; i < n; i++) {
        int left = (i == 0 || arr[i] >= arr[i - 1]);
        int right = (i == n - 1 || arr[i] >= arr[i + 1]);
        if (left && right) {
            printf("%lld\\n", arr[i]);
            return 0;
        }
    }
    return 0;
}`
    }
  },
  {
    id: 'acc-tech-1',
    title: 'Two Sum Target Pairs',
    company: 'Accenture',
    difficulty: 'Medium',
    category: 'Hash Map & Pointers',
    timeLimitSeconds: 2.0,
    memoryLimitMB: 256,
    description: `Given an array of integers \`nums\` and an integer \`target\`, find the 0-based indices of the two numbers such that they add up to \`target\`.

Output the indices sorted in ascending order (e.g. \`0 1\`). Assume exactly one valid pair exists for all test inputs.`,
    inputFormat: `Line 1: Two space-separated integers N and Target.\nLine 2: N space-separated integers.`,
    outputFormat: `Print the two 0-based indices space-separated.`,
    constraints: `2 <= N <= 10^5\n-10^9 <= nums[i] <= 10^9`,
    sampleTestCases: [
      {
        input: `4 9\n2 7 11 15`,
        expectedOutput: `0 1`,
        explanation: `nums[0] + nums[1] == 2 + 7 == 9. Indices are 0 1.`
      },
      {
        input: `3 6\n3 2 4`,
        expectedOutput: `1 2`,
        explanation: `nums[1] + nums[2] == 2 + 4 == 6. Indices are 1 2.`
      }
    ],
    hiddenTestCases: [
      {
        input: `2 6\n3 3`,
        expectedOutput: `0 1`,
        isHidden: true
      },
      {
        input: `5 10\n1 4 5 9 6`,
        expectedOutput: `1 4`,
        isHidden: true
      }
    ],
    starterCode: {
      python: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    target = int(tokens[1])
    nums = [int(x) for x in tokens[2:2+n]]
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long target = sc.nextLong();
        long[] nums = new long[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextLong();
        
        Map<Long, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            long diff = target - nums[i];
            if (map.containsKey(diff)) {
                System.out.println(map.get(diff) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n;
    long long target;
    if (!(cin >> n >> target)) return 0;
    vector<long long> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    
    unordered_map<long long, int> seen;
    for (int i = 0; i < n; i++) {
        long long diff = target - nums[i];
        if (seen.find(diff) != seen.end()) {
            cout << seen[diff] << " " << i << endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    int n;
    long long target;
    if (scanf("%d %lld", &n, &target) != 2) return 0;
    long long nums[10005];
    for (int i = 0; i < n; i++) scanf("%lld", &nums[i]);
    
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                return 0;
            }
        }
    }
    return 0;
}`
    }
  }
];

module.exports = { CODING_PROBLEMS };
