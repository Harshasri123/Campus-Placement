import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';

export const C_CPP_CSHARP_QUESTIONS = [
  // ==========================================
  // C PROGRAMMING QUESTIONS
  // ==========================================
  {
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Pointers & Arrays',
    question_text: `What is the output of the following C code snippet?
#include <stdio.h>
int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int *ptr = (int*)(&arr + 1);
    printf("%d %d", *(arr + 1), *(ptr - 1));
    return 0;
}`,
    options: ["20 50", "10 50", "20 40", "Undefined Behavior"],
    correct_option: 0,
    explanation: "*(arr + 1) evaluates to arr[1], which is 20. &arr has type int(*)[5] (pointer to the entire array of 5 ints). Adding 1 (&arr + 1) advances by sizeof(arr) past the last element. Casting to (int*) and subtracting 1 points to arr[4], which is 50. Hence, the output is '20 50'.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Dynamic Memory',
    question_text: "Which of the following statements accurately contrasts calloc() and malloc() in standard C?",
    options: [
      "calloc allocates memory on the stack, whereas malloc allocates on the heap",
      "calloc allocates contiguous blocks and zeroes out all allocated bytes, while malloc leaves bytes uninitialized",
      "malloc can be freed with free(), but calloc requires cfree()",
      "calloc cannot allocate more than 64 KB of memory at once"
    ],
    correct_option: 1,
    explanation: "calloc(num, size) allocates memory for an array of num elements of size bytes and clears all allocated memory to zero. malloc(size) allocates raw memory containing indeterminate (garbage) values without zeroing.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Storage Classes & Volatile',
    question_text: "In C systems programming, what is the primary purpose of the 'volatile' type qualifier?",
    options: [
      "To allocate the variable in processor registers for high-speed access",
      "To prevent the variable from being modified by any other function",
      "To inform the compiler that the variable's value can change asynchronously outside compiler control, preventing aggressive optimization",
      "To make the variable thread-safe by applying an automatic OS lock"
    ],
    correct_option: 2,
    explanation: "The 'volatile' qualifier informs the compiler that a variable's value can be changed by something external to the code (e.g. an interrupt handler, hardware register, or concurrent thread), so the compiler must re-read it from memory every time rather than caching it in a register.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Structures & Memory Alignment',
    question_text: `Consider the following struct on a 64-bit architecture with 4-byte integer alignment:
struct Data {
    char a;
    int b;
    char c;
};
What does sizeof(struct Data) evaluate to?`,
    options: ["6 bytes", "8 bytes", "12 bytes", "16 bytes"],
    correct_option: 2,
    explanation: "char a is 1 byte, followed by 3 padding bytes so int b aligns at a 4-byte boundary (offset 4-7). char c is at offset 8, followed by 3 trailing padding bytes to ensure the struct total size is a multiple of its 4-byte alignment requirement: 1 + 3 + 4 + 1 + 3 = 12 bytes.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Strings & Recursion',
    question_text: `What does the following recursive function return when called with mystery("placement")?
int mystery(char *str) {
    if (*str == '\\0') return 0;
    return 1 + mystery(str + 1);
}`,
    options: ["0", "9", "10", "Runtime segmentation fault"],
    correct_option: 1,
    explanation: "The function counts characters until it hits the null-terminator '\\0', functioning identically to strlen(). The word 'placement' has 9 characters, so it returns 9.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Bitwise Manipulation',
    question_text: "Which of the following bitwise expressions determines whether an unsigned integer n is a power of 2 (for n > 0)?",
    options: [
      "(n & (n - 1)) == 0",
      "(n | (n - 1)) == n",
      "(n ^ (n + 1)) == 0",
      "(n & ~n) == 1"
    ],
    correct_option: 0,
    explanation: "A power of 2 has exactly one binary bit set to 1 (e.g. 8 is 1000b). (n - 1) flips all lower bits (7 is 0111b). Bitwise AND (n & (n - 1)) yields 0 if and only if n has only one set bit.",
    is_daily_question: false,
    daily_date: null
  },

  // ==========================================
  // C++ PROGRAMMING QUESTIONS
  // ==========================================
  {
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'Polymorphism & VTABLE',
    question_text: "How does C++ achieve runtime polymorphism (dynamic dispatch) when calling a virtual method through a base pointer?",
    options: [
      "Through runtime source interpretation of AST nodes",
      "Through a hidden vptr in each object pointing to a class-level vtable (virtual method table)",
      "By inlining derived class machine instructions into the base class",
      "By doing string matching against RTTI type names on each invocation"
    ],
    correct_option: 1,
    explanation: "When a class contains virtual functions, the compiler generates a vtable (array of function pointers) for the class and inserts an invisible vptr in each object pointing to its class's vtable. Calling a virtual method dereferences the vptr to invoke the derived method dynamically.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'Constructors & Rule of Three',
    question_text: "What C++ programming idiom states that if a class manages dynamic resources and defines a destructor, it must also define a copy constructor and copy assignment operator?",
    options: [
      "The Principle of Least Astonishment",
      "The Rule of Three (extended to Rule of Five in C++11)",
      "The Dependency Inversion Principle",
      "The RAII Idiom for Templates"
    ],
    correct_option: 1,
    explanation: "The Rule of Three states that if a class requires a user-defined destructor to clean up resources, it almost certainly requires a user-defined copy constructor and copy assignment operator to avoid shallow copies and double-free errors.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'STL & Data Structures',
    question_text: "What are the underlying data structures and search time complexities for std::map and std::unordered_map in C++?",
    options: [
      "std::map uses Hash Table O(1); std::unordered_map uses Red-Black Tree O(log N)",
      "std::map uses Red-Black Tree O(log N); std::unordered_map uses Hash Table average O(1)",
      "Both use doubly linked lists with O(N) linear scan",
      "std::map uses B-Tree O(1); std::unordered_map uses Binary Search Tree O(log N)"
    ],
    correct_option: 1,
    explanation: "std::map stores keys in sorted order using a self-balancing Red-Black binary search tree (O(log N) lookup). std::unordered_map organizes keys into hash buckets using a hash table (average O(1) lookup).",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'Smart Pointers & Memory',
    question_text: "Which C++ smart pointer is explicitly designed to break cyclic references between std::shared_ptr instances to prevent memory leaks?",
    options: [
      "std::auto_ptr",
      "std::unique_ptr",
      "std::weak_ptr",
      "std::scoped_ptr"
    ],
    correct_option: 2,
    explanation: "std::weak_ptr references an object managed by std::shared_ptr without incrementing its strong reference count. This allows cyclic data structures (like graphs and trees) to destruct cleanly when no strong references remain.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'Type Safety & Constructors',
    question_text: "What does the 'explicit' keyword prevent when applied to a single-argument constructor in C++?",
    options: [
      "It prevents the constructor from allocating dynamic heap memory",
      "It prevents implicit type conversions and copy-initialization from the argument type",
      "It prevents derived classes from overriding the constructor",
      "It prevents the class from being instantiated as a local variable"
    ],
    correct_option: 1,
    explanation: "Declaring a single-argument constructor as 'explicit' forbids the compiler from using that constructor for implicit conversions (e.g. MyClass obj = 10;), requiring direct explicit initialization (MyClass obj(10);).",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'Compile-Time Computing',
    question_text: "What is the key advantage of declaring a function with 'constexpr' in C++11 and later standards?",
    options: [
      "The function runs concurrently in a background OS thread",
      "The function can be evaluated at compile-time when passed constant arguments, generating zero runtime overhead",
      "The function is forbidden from returning arithmetic values",
      "The function can only accept void arguments"
    ],
    correct_option: 1,
    explanation: "constexpr indicates that the function can be evaluated at compile time if all arguments are known constants. This enables compile-time array sizing, template metaprogramming, and zero runtime performance penalty.",
    is_daily_question: false,
    daily_date: null
  },

  // ==========================================
  // C# (.NET) PROGRAMMING QUESTIONS
  // ==========================================
  {
    category: 'Programming',
    sub_category: 'C# (.NET)',
    topic_tag: 'CLR Memory & Boxing',
    question_text: "In C# and the .NET Common Language Runtime (CLR), what is 'Boxing' and what is its performance implication?",
    options: [
      "Converting a reference type to a value type on the stack with zero overhead",
      "Converting a value type to System.Object or an interface, allocating a wrapper on the managed heap and inducing GC pressure",
      "Compressing assembly binaries into executable archives",
      "Serializing an XML data stream into JSON format"
    ],
    correct_option: 1,
    explanation: "Boxing is the process of converting a value type (stored on the stack or inline) to the type object or any interface type it implements. The CLR allocates an object instance on the heap and copies the value into it, adding heap allocation and GC overhead.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C# (.NET)',
    topic_tag: 'IDisposable & Using',
    question_text: `What is the exact equivalent behavior of the following C# code?
using (var stream = new FileStream("data.bin", FileMode.Open)) {
    stream.ReadByte();
}`,
    options: [
      "It runs the stream in a background thread and cancels it after 5 seconds",
      "It wraps the code in a try-finally block and guarantees stream.Dispose() is called inside finally even if an exception occurs",
      "It suppresses all IOExceptions thrown by the stream",
      "It automatically synchronizes file changes to a SQL database"
    ],
    correct_option: 1,
    explanation: "The C# using statement is syntactic sugar for a try-finally block where Dispose() is called deterministically in the finally clause, ensuring unmanaged resources (file handles, sockets) are released promptly.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C# (.NET)',
    topic_tag: 'Delegates & Lambdas',
    question_text: "In the .NET BCL, what is the primary distinction between Action<T> and Func<T, TResult>?",
    options: [
      "Action returns a bool, while Func returns void",
      "Action encapsulates a method that does not return a value (void), while Func encapsulates a method that returns a value of type TResult",
      "Action can only be used asynchronously, while Func is synchronous only",
      "Func cannot accept more than 1 argument"
    ],
    correct_option: 1,
    explanation: "Action<T> represents a delegate that takes parameter(s) and returns void. Func<T, TResult> represents a delegate that takes parameter(s) and returns a value of type TResult (the last generic type argument).",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C# (.NET)',
    topic_tag: 'LINQ & Deferred Execution',
    question_text: `What is the output of the following C# code?
var numbers = new List<int> { 1, 2, 3 };
var query = numbers.Where(n => n > 1);
numbers.Add(4);
Console.WriteLine(query.Count());`,
    options: ["1", "2", "3", "4"],
    correct_option: 2,
    explanation: "LINQ queries utilize deferred (lazy) execution. The query is not evaluated when defined with .Where(). When .Count() is executed, the current list contains {1, 2, 3, 4}. The elements greater than 1 are 2, 3, and 4, so Count() returns 3.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C# (.NET)',
    topic_tag: 'Async/Await & Concurrency',
    question_text: "In C# asynchronous programming, what is the primary purpose of applying .ConfigureAwait(false) to an awaited Task in library code?",
    options: [
      "To cancel the task if it takes longer than 1 second",
      "To avoid capturing and resuming on the original SynchronizationContext (such as the UI thread), improving throughput and preventing deadlocks",
      "To force the task to execute synchronously on the main thread",
      "To catch all aggregate exceptions silently"
    ],
    correct_option: 1,
    explanation: "ConfigureAwait(false) prevents the await continuation from capturing and marshalling back onto the original SynchronizationContext (e.g. UI thread or ASP.NET request context), which avoids thread deadlocks and improves performance in backend/library code.",
    is_daily_question: false,
    daily_date: null
  },
  {
    category: 'Programming',
    sub_category: 'C# (.NET)',
    topic_tag: 'Null Safety & Operators',
    question_text: "What does the null-coalescing assignment operator '??=' do in C# 8.0 and later?",
    options: [
      "Assigns the left-hand variable to null unconditionally",
      "Assigns the value of the right-hand operand to the left-hand operand only if the left-hand operand evaluates to null",
      "Tests if both operands are null and returns a boolean",
      "Throws a NullReferenceException if the right-hand operand is null"
    ],
    correct_option: 1,
    explanation: "The ??= operator assigns the value of the right-hand operand to its left-hand operand only if the left-hand operand evaluates to null. If the left-hand operand is already non-null, it is left untouched.",
    is_daily_question: false,
    daily_date: null
  }
];

export async function seedProgrammingLanguages() {
  const client = await pool.connect();
  try {
    console.log('🔄 Seeding C, C++, and C# placement questions into PostgreSQL...');

    let insertedCount = 0;
    for (const q of C_CPP_CSHARP_QUESTIONS) {
      // Check if question with identical question_text exists
      const check = await client.query(
        'SELECT id FROM quiz.questions WHERE question_text = $1',
        [q.question_text]
      );

      if (check.rows.length === 0) {
        await client.query(
          `INSERT INTO quiz.questions (
            category, sub_category, topic_tag, question_text, options, correct_option, explanation, is_daily_question, daily_date
          ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)`,
          [
            q.category,
            q.sub_category,
            q.topic_tag,
            q.question_text,
            JSON.stringify(q.options),
            q.correct_option,
            q.explanation,
            q.is_daily_question,
            q.daily_date
          ]
        );
        insertedCount++;
      }
    }

    console.log(`✅ Seeded ${insertedCount} new C, C++, and C# placement questions.`);
    return insertedCount;
  } catch (err) {
    console.error('❌ Error seeding programming questions:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('seedProgrammingLanguages.js')) {
  seedProgrammingLanguages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
