import type { Flashcard, Lesson, ReminderItem, SubjectUnit } from '../types/study';

export const DECO_COURSE_INFO = {
  code: 'U24EC304',
  title: 'Digital Electronics & Computer Organization',
  semester: 'B.E. III Semester',
  credits: 3,
  cieMarks: 40,
  seeMarks: 60,
};

export const DECO_SUBJECTS: SubjectUnit[] = [
  {
    id: 'unit-1',
    code: 'Unit I',
    title: 'Computer Structure & Data Representation',
    courseOutcome: 'CO1',
    description:
      'Functional units, Von Neumann architecture, bus structures, performance metrics, number conversions, signed integers, IEEE 754 floating-point, and binary/Hamming codes.',
    examWeightLabel: 'CIE-1 & SEE · 20%',
  },
  {
    id: 'unit-2',
    code: 'Unit II',
    title: 'Switching Theory & Digital Logic Circuits',
    courseOutcome: 'CO2',
    description:
      'Boolean laws, logic & universal gates, canonical SOP/POS, K-Map & Quine-McCluskey minimization, combinational adders/MUX/decoders, and sequential flip-flops/counters.',
    examWeightLabel: 'CIE-1 & SEE · 22%',
  },
  {
    id: 'unit-3',
    code: 'Unit III',
    title: 'Computer Arithmetic, RTL & Microprogramming',
    courseOutcome: 'CO3',
    description:
      'Booth multiplication, restoring & non-restoring division, instruction formats, addressing modes, RTL micro-operations, and microprogrammed control units.',
    examWeightLabel: 'CIE-2 & SEE · 20%',
  },
  {
    id: 'unit-4',
    code: 'Unit IV',
    title: 'Input/Output & Memory Organization',
    courseOutcome: 'CO4',
    description:
      'I/O interfaces, isolated vs memory-mapped I/O, programmed/interrupt/DMA transfers, memory hierarchy, RAM/ROM, and cache mapping techniques.',
    examWeightLabel: 'CIE-2 & SEE · 20%',
  },
  {
    id: 'unit-5',
    code: 'Unit V',
    title: 'Pipelining & RISC/CISC Architectures',
    courseOutcome: 'CO5',
    description:
      'CISC vs RISC characteristics, instruction pipelining stages, speedup equations, pipelined datapath & control, hazards (RAW/WAR/WAW), forwarding, and superscalar execution.',
    examWeightLabel: 'CIE-2 & SEE · 18%',
  },
];

export const DECO_LESSONS: Lesson[] = [
  // ================= UNIT I =================
  {
    id: 'u1-l1',
    subjectId: 'unit-1',
    order: 1,
    title: 'Functional Units & Von Neumann Architecture',
    summary:
      'Explore the five functional units of a digital computer—Input, Memory, ALU, Output, and Control Unit—and how stored-program execution creates the Von Neumann bottleneck.',
    estimatedMinutes: 20,
    courseOutcome: 'CO1',
    keyPoints: [
      'A stored-program computer keeps both machine instructions and program data inside a single main memory space.',
      'Five core functional units: Input Unit (reads external data), Memory Unit (primary & secondary storage), Arithmetic & Logic Unit (ALU), Output Unit, and Control Unit (CU coordinates timing and control signals).',
      'Core CPU registers: PC (Program Counter holds next instruction address), IR (Instruction Register holds current instruction), MAR (Memory Address Register), MDR (Memory Data Register), and AC (Accumulator).',
      'Von Neumann bottleneck: CPU and Main Memory share a single system bus, limiting instruction + data throughput per cycle.',
    ],
    diagram: {
      src: '/assets/aistudio/DECO1_1cb5244a.JPG',
      alt: 'Von Neumann Architecture showing CPU (Control Unit, ALU, Registers, Cache) connected across a shared bus to Main Memory (Instructions and Data)',
      caption: 'Von Neumann Architecture: shared single memory space and CPU-memory bus bottleneck.',
    },
    table: {
      caption: 'Essential CPU Registers & Roles',
      headers: ['Register', 'Full Name', 'Primary Function'],
      rows: [
        ['PC', 'Program Counter', 'Holds address of the next instruction to fetch'],
        ['IR', 'Instruction Register', 'Stores the opcode & operands of current instruction'],
        ['MAR', 'Memory Address Register', 'Holds memory address for Read/Write access'],
        ['MDR', 'Memory Data Register', 'Buffers data transferred to/from memory'],
      ],
    },
    examTip: 'CIE-1 & Quiz 01 frequently ask which register holds the next instruction address (PC) and the roles of ALU vs CU.',
  },
  {
    id: 'u1-l2',
    subjectId: 'unit-1',
    order: 2,
    title: 'Bus Structures, Multiprocessors & Multicomputers',
    summary:
      'Understand single-bus vs multi-bus interconnections, data/address/control lines, and architectural differences between multiprocessors and multicomputers.',
    estimatedMinutes: 18,
    courseOutcome: 'CO1',
    keyPoints: [
      'System Bus consists of three line groups: Data Bus (bidirectional word transfer), Address Bus (unidirectional CPU-to-memory/I/O addressing), and Control Bus (RD/WR, IRQ, Clock, Bus Grant).',
      'Single-bus structures are low-cost and flexible but allow only one transfer at a time; multi-bus structures enable simultaneous transfers and higher bandwidth.',
      'Multiprocessors share a single global physical memory (UMA/NUMA) under one OS and communicate via shared variables.',
      'Multicomputers consist of autonomous nodes with private local memories connected over a message-passing network.',
    ],
    table: {
      caption: 'Multiprocessor vs. Multicomputer Comparison (Assignment 1)',
      headers: ['Dimension', 'Multiprocessor', 'Multicomputer'],
      rows: [
        ['Memory Model', 'Shared global memory space', 'Distributed private local memory'],
        ['Communication', 'Shared variables / cache coherence', 'Message passing over interconnect'],
        ['Coupling', 'Tightly coupled', 'Loosely coupled'],
        ['Scalability', 'Limited by bus/coherence contention', 'Scales easily to thousands of nodes'],
      ],
    },
    examTip: 'Assignment 1 Q2 & Q3 specifically ask for bus types and the difference between multiprocessors and multicomputers.',
  },
  {
    id: 'u1-l3',
    subjectId: 'unit-1',
    order: 3,
    title: 'Software Layers & Performance Metrics',
    summary:
      'Analyze how compilers, assemblers, and OS scheduling interact with hardware using CPU execution time, CPI, clock rate, and MIPS.',
    estimatedMinutes: 18,
    courseOutcome: 'CO1',
    keyPoints: [
      'System software (OS, Compiler, Assembler, Linker) translates high-level code into binary machine instructions and manages CPU, memory, and I/O resources.',
      'Processor Clock Period T = 1 / f (clock frequency). Lowering CPI or instruction count directly improves execution speed.',
      'Throughput measures tasks completed per unit time; Response Time (Latency) measures elapsed time for a single task.',
      'Endianness: Big-endian stores MSB at the lowest memory address; Little-endian stores LSB at the lowest memory address.',
    ],
    formulas: [
      'CPU Time = (Instruction Count × CPI) / Clock Rate = IC × CPI × Clock Cycle Time',
      'Speedup = Execution Time_old / Execution Time_new',
      'MIPS = Clock Rate / (CPI × 10^6)',
    ],
    workedExample: {
      prompt: 'A 2 GHz CPU executes 4 × 10^8 instructions with an average CPI of 1.5. Find the CPU execution time.',
      solution: 'CPU Time = (4 × 10^8 × 1.5) / (2 × 10^9 Hz) = 6 × 10^8 / 2 × 10^9 = 0.30 seconds.',
    },
    examTip: 'Memorize the Little-Endian rule from Quiz 01: LSB (not MSB) is stored at the lowest memory address.',
  },
  {
    id: 'u1-l4',
    subjectId: 'unit-1',
    order: 4,
    title: 'Number Base Conversions & Binary Codes',
    summary:
      'Master conversions across Decimal, Binary, Octal, and Hexadecimal (including fractions), plus BCD, Excess-3, Gray code, and ASCII.',
    estimatedMinutes: 25,
    courseOutcome: 'CO1',
    keyPoints: [
      'Positional systems (Binary, Octal, Decimal, Hex) weight digits by radix powers r^i; Roman numerals are non-positional.',
      'Decimal-to-base r: divide integer part repeatedly by r (read remainders bottom-up); multiply fractional part repeatedly by r (read carries top-down).',
      'Binary-to-Gray conversion: keep MSB G_n = B_n, then XOR adjacent bits G_i = B_{i+1} ⊕ B_i. Gray code changes only 1 bit between consecutive values.',
      'BCD (8421) encodes each decimal digit as 4 bits (0000–1001); Excess-3 adds 3 (0011) to each BCD digit for self-complementing arithmetic; ASCII uses 7 bits (128 chars).',
    ],
    workedExample: {
      prompt: 'Convert (a) (520)_10 to Hex, (b) 163.875_10 to Binary, and (c) binary 110101 to Gray code.',
      solution:
        '(a) 520 / 16 = 32 R 8; 32 / 16 = 2 R 0; 2 / 16 = 0 R 2 → (208)_16.\n(b) 163 = 10100011_2; 0.875 × 2 = 1.75 (1), 0.75 × 2 = 1.5 (1), 0.5 × 2 = 1.0 (1) → 10100011.111_2.\n(c) MSB = 1; 1⊕1=0, 1⊕0=1, 0⊕1=1, 1⊕0=1, 0⊕1=1 → Gray: 101111.',
    },
    examTip: 'Practice fractional base conversions and Binary ↔ Gray XOR steps—both appear verbatim in Assignment 1 & Quiz 01.',
  },
  {
    id: 'u1-l5',
    subjectId: 'unit-1',
    order: 5,
    title: 'Signed Integers, Complements & Overflow',
    summary:
      'Compare Sign-Magnitude, 1’s Complement, and 2’s Complement representations, binary subtraction, and signed overflow detection.',
    estimatedMinutes: 22,
    courseOutcome: 'CO1',
    keyPoints: [
      'Sign-Magnitude uses MSB as sign bit (0 = +, 1 = −) and remaining n−1 bits as magnitude; has two zeros (+0 and −0).',
      "1's Complement inverts all bits for negative numbers; range is −(2^(n−1)−1) to +(2^(n−1)−1) and still has dual zero.",
      "2's Complement = 1's Complement + 1 (invert bits and add 1). Unique zero, single hardware adder for A − B = A + (~B + 1), range −2^(n−1) to +2^(n−1) − 1.",
      'Signed Overflow Rule: Overflow occurs when adding two numbers of the same sign produces the opposite sign, or equivalently V = C_n ⊕ C_{n−1}.',
    ],
    workedExample: {
      prompt: "Represent -18 in 8-bit 2's complement form.",
      solution: "+18 = 00010010_2 → 1's complement = 11101101 → add 1 → -18 = 11101110_2.",
    },
    examTip: 'Always state the bit-width (e.g., 8-bit) when writing complement representations.',
  },
  {
    id: 'u1-l6',
    subjectId: 'unit-1',
    order: 6,
    title: 'IEEE 754 Floating-Point & Error Correction Codes',
    summary:
      'Encode real numbers in IEEE 754 Single/Double Precision and detect/correct single-bit errors using parity and Hamming codes.',
    estimatedMinutes: 25,
    courseOutcome: 'CO1',
    keyPoints: [
      'IEEE 754 Single Precision (32-bit): 1-bit Sign (S), 8-bit Biased Exponent (E = e + 127), 23-bit Mantissa/Fraction (M) representing (−1)^S × (1.M) × 2^(E−127).',
      'IEEE 754 Double Precision (64-bit): 1-bit Sign, 11-bit Exponent (Bias = 1023), 52-bit Mantissa.',
      'Even/Odd Parity detects odd numbers of bit flips (1-bit error detection, no correction).',
      'Hamming Code places parity bits at powers of 2 (positions 1, 2, 4, 8...) such that 2^r ≥ m + r + 1. Syndrome bits point directly to the corrupted bit index for single-bit correction.',
    ],
    formulas: [
      'IEEE 754 Single: (-1)^S × (1.M)_2 × 2^(E - 127)',
      'Hamming Redundancy Inequality: 2^r >= m + r + 1',
    ],
    workedExample: {
      prompt: 'For 4 data bits (m = 4), how many Hamming parity bits r are needed?',
      solution: 'Try r = 3: 2^3 = 8 >= 4 + 3 + 1 = 8 (True). Total codeword length = 7 bits (Hamming(7,4)).',
    },
    examTip: 'Remember Bias = 127 for 32-bit single precision and 2^r >= m + r + 1 for Hamming(7,4).',
  },

  // ================= UNIT II =================
  {
    id: 'u2-l1',
    subjectId: 'unit-2',
    order: 1,
    title: 'Boolean Algebra Laws & De Morgan Theorems',
    summary:
      'Simplify switching expressions algebraically using Identity, Absorption, Consensus, Duality, and De Morgan’s laws.',
    estimatedMinutes: 22,
    courseOutcome: 'CO2',
    keyPoints: [
      "Core identities: A + A' = 1, A·A' = 0, A + AB = A (Absorption), A + A'B = A + B.",
      "Consensus Theorem: AB + A'C + BC = AB + A'C (the BC term is redundant).",
      "De Morgan's Theorems: (A + B)' = A' · B' and (A · B)' = A' + B' (break the bar, change the operator).",
      'Duality Principle: every valid Boolean equation remains valid when AND ↔ OR and 0 ↔ 1 are swapped.',
    ],
    formulas: [
      "(A + B)' = A' · B'   |   (A · B)' = A' + B'",
      "Consensus: XY + X'Z + YZ = XY + X'Z",
      "Distributive: A + BC = (A + B)(A + C)",
    ],
    examTip: 'Use A + BC = (A + B)(A + C) rapidly when converting expressions between SOP and POS.',
  },
  {
    id: 'u2-l2',
    subjectId: 'unit-2',
    order: 2,
    title: 'Logic Gates, Universal Gates & XOR/XNOR',
    summary:
      'Analyze basic gates, realize any Boolean function using only NAND or NOR universal gates, and apply XOR/XNOR parity logic.',
    estimatedMinutes: 20,
    courseOutcome: 'CO2',
    keyPoints: [
      'Basic gates: AND (Y = A·B), OR (Y = A+B), NOT (Y = A\').',
      'Universal gates: NAND and NOR can each synthesize NOT, AND, and OR—and therefore every Boolean function.',
      'XOR (A ⊕ B = A\'B + AB\'): outputs 1 when inputs differ (odd-1s detector, used in adders and Gray code).',
      'XNOR ((A ⊕ B)\' = AB + A\'B\'): outputs 1 when all inputs are equal (1-bit equality comparator).',
    ],
    diagram: {
      src: '/assets/aistudio/Xor_b0f26fef.JPG',
      alt: 'Logic gate symbol and behavior comparison for XOR (exclusive OR) and XNOR (exclusive NOR) gates',
      caption: 'XOR vs. XNOR gate symbols and Boolean behavior.',
    },
    table: {
      caption: 'Universal Gate Equivalences',
      headers: ['Target Gate', 'Using Only NAND', 'Using Only NOR'],
      rows: [
        ['NOT (A\')', '1 NAND (tie inputs)', '1 NOR (tie inputs)'],
        ['AND (A·B)', '2 NANDs (NAND then invert)', '3 NORs'],
        ['OR (A+B)', '3 NANDs (invert inputs then NAND)', '2 NORs (NOR then invert)'],
      ],
    },
    examTip: 'Two-level AND-OR circuits map directly to NAND-NAND; OR-AND circuits map directly to NOR-NOR.',
  },
  {
    id: 'u2-l3',
    subjectId: 'unit-2',
    order: 3,
    title: 'Canonical SOP & POS Forms (Minterms & Maxterms)',
    summary:
      'Convert Boolean expressions into canonical Sum of Products (Σm) and Product of Sums (ΠM) forms for K-Map and circuit synthesis.',
    estimatedMinutes: 22,
    courseOutcome: 'CO2',
    keyPoints: [
      'A Minterm (m_i) is a product term containing all n variables (1 where variable=1, 0 where complemented). SOP sums minterms where F = 1: F = Σm(...).',
      'A Maxterm (M_i) is a sum term containing all n variables (0 where variable=1, 1 where complemented). POS multiplies maxterms where F = 0: F = ΠM(...).',
      'Complement conversion: if a 3-variable function is Σm(1, 2, 7), its canonical POS is ΠM(0, 3, 4, 5, 6).',
      'Expansion into canonical SOP multiplies missing variables using (X + X\') = 1; canonical POS adds missing variables using (X · X\') = 0.',
    ],
    workedExample: {
      prompt: "Expand F(A,B,C) = A + BC' into canonical minterms (Assignment 1 Q5 style).",
      solution:
        "A = A(B+B')(C+C') = ABC + ABC' + AB'C + AB'C' (m7, m6, m5, m4).\nBC' = (A+A')BC' = ABC' + A'BC' (m6, m2).\nUnion: F = Σm(2, 4, 5, 6, 7) and F = ΠM(0, 1, 3).",
    },
    examTip: 'Remember the duality between m_i and M_i: F\'s maxterm indices are the exact complement set of F\'s minterm indices.',
  },
  {
    id: 'u2-l4',
    subjectId: 'unit-2',
    order: 4,
    title: 'K-Map Minimization & Quine-McCluskey Tabulation',
    summary:
      'Minimize 2, 3, and 4-variable switching functions with Karnaugh maps (including Don’t Cares) and systematic Quine-McCluskey tables.',
    estimatedMinutes: 28,
    courseOutcome: 'CO2',
    keyPoints: [
      'K-Map cells follow Gray code order (00, 01, 11, 10) so adjacent cells—and wrap-around edges—differ by only 1 bit.',
      'Group 1s (for SOP) or 0s (for POS) in maximal powers of 2 (1, 2, 4, 8, 16) to eliminate the most variables.',
      "Don't Care conditions (d / X) may be included in groups only if they allow larger power-of-2 groupings.",
      'Prime Implicant (PI) cannot be merged further; Essential Prime Implicant (EPI) covers at least one minterm covered by no other PI.',
      'Quine-McCluskey (Tabulation Method) groups minterms by 1-bit count, merges pairs differing in 1 bit, and builds a Prime Implicant chart for ≥ 5 variables.',
    ],
    workedExample: {
      prompt: 'Design a 3-input (A,B,C) majority circuit outputting X = 1 when ones outnumber zeros (Surprise Test 1 Q3).',
      solution: 'Minterms with ≥ 2 ones: m3(011), m5(101), m6(110), m7(111). Grouping (m5,m7), (m6,m7), (m3,m7) yields X = AB + BC + AC.',
    },
    examTip: 'Always double-check wrap-around corners (m0, m2, m8, m10 in a 4-var map) to spot 4-cell quads!',
  },
  {
    id: 'u2-l5',
    subjectId: 'unit-2',
    order: 5,
    title: 'Combinational Circuits: Adders, Subtractors, MUX & Decoders',
    summary:
      'Design Half/Full Adders, 4-bit Adder/Subtractor with overflow, Multiplexers, and Decoders from truth tables and gate diagrams.',
    estimatedMinutes: 26,
    courseOutcome: 'CO2',
    keyPoints: [
      'Half Adder: Sum = A ⊕ B, Carry = A·B (2 inputs, 2 outputs).',
      'Full Adder: Sum = A ⊕ B ⊕ Cin, Cout = AB + Cin(A ⊕ B). Built from two Half Adders + one OR gate.',
      '4-bit Binary Adder/Subtractor uses 4 Full Adders with XOR gates on B_i controlled by mode M (M=0 adds, M=1 forms 2\'s complement B\'+1). Signed overflow V = C4 ⊕ C3.',
      'Multiplexer (2^n : 1 MUX) selects 1 of 2^n data lines via n select bits; implements arbitrary n+1 variable Boolean functions.',
      'Decoder (n : 2^n) activates exactly one output minterm line; combined with OR gates it synthesizes multi-output logic.',
    ],
    formulas: [
      'Full Adder Sum = A ⊕ B ⊕ Cin',
      'Full Adder Cout = AB + BCin + ACin = AB + Cin(A ⊕ B)',
      '4-bit Signed Overflow V = C4 ⊕ C3',
    ],
    examTip: 'LAQ 3 in CIE-2 QB tests the 4-bit binary adder/subtractor with XOR mode control M and overflow V = C4 ⊕ C3.',
  },
  {
    id: 'u2-l6',
    subjectId: 'unit-2',
    order: 6,
    title: 'Sequential Circuits: Flip-Flops, Shift Registers & Counters',
    summary:
      'Master SR, D, JK, and T flip-flops, race-around mitigation, SISO/SIPO/PISO/PIPO shift registers, and synchronous/ripple/ring counters.',
    estimatedMinutes: 28,
    courseOutcome: 'CO2',
    keyPoints: [
      'SR Flip-Flop invalid state (S=1, R=1) is solved by JK Flip-Flop (J=1, K=1 toggles Q\' ).',
      'Race-Around Condition occurs in level-triggered JK when J=K=1 and clock pulse width > propagation delay; eliminated by Master-Slave or Edge-Triggered flip-flops.',
      'D Flip-Flop (Q(t+1) = D) acts as 1-bit data latch/delay; T Flip-Flop (Q(t+1) = T ⊕ Q) acts as divide-by-2 toggle.',
      'Shift Registers (SISO, SIPO, PISO, PIPO) shift bits per clock pulse for serial↔parallel conversion and arithmetic scaling.',
      'Asynchronous (Ripple) counters suffer cumulative propagation delay; Synchronous counters clock all flip-flops simultaneously. Ring counter (n states) vs Johnson counter (2n states).',
    ],
    table: {
      caption: 'Characteristic Equations of Standard Flip-Flops',
      headers: ['Flip-Flop', 'Characteristic Equation', 'Toggle / Hold Behavior'],
      rows: [
        ['SR', "Q(t+1) = S + R'Q (SR = 0)", 'S=0,R=0 holds; S=1,R=1 forbidden'],
        ['D', 'Q(t+1) = D', 'Transparent data storage at clock edge'],
        ['JK', "Q(t+1) = JQ' + K'Q", 'J=1,K=1 toggles output'],
        ['T', 'Q(t+1) = T ⊕ Q', 'T=0 holds, T=1 toggles'],
      ],
    },
    examTip: 'Know the Master-Slave JK solution to race-around and the difference in modulus between Ring (N) and Johnson (2N) counters.',
  },

  // ================= UNIT III =================
  {
    id: 'u3-l1',
    subjectId: 'unit-3',
    order: 1,
    title: "Binary Multiplication & Booth's Algorithm",
    summary:
      'Trace unsigned shift-and-add hardware and signed 2’s complement Booth multiplication using bit-pair recoding.',
    estimatedMinutes: 25,
    courseOutcome: 'CO3',
    keyPoints: [
      'Unsigned multiplication shifts partial product right after inspecting multiplier LSB Q_0 (add multiplicand M if Q_0 = 1).',
      "Booth's Algorithm multiplies signed 2's complement numbers uniformly by inspecting (Q_0, Q_{-1}) each cycle.",
      'Booth rules: 00 or 11 → Arithmetic Shift Right (ASR) only; 10 → A ← A − M then ASR; 01 → A ← A + M then ASR.',
      'Bit-pair recoding reduces summands by half for faster hardware multipliers.',
    ],
    table: {
      caption: "Booth's Algorithm Decision Table",
      headers: ['Q_0', 'Q_{-1}', 'Operation before ASR(A, Q, Q_{-1})'],
      rows: [
        ['0', '0', 'No arithmetic operation (shift only)'],
        ['0', '1', 'A ← A + M (end of string of 1s)'],
        ['1', '0', 'A ← A - M (start of string of 1s)'],
        ['1', '1', 'No arithmetic operation (shift only)'],
      ],
    },
    workedExample: {
      prompt: "Multiply (+7) × (-3) in 5-bit Booth's algorithm.",
      solution: 'M = 00111 (+7), -M = 11001, Q = 11101 (-3), Q_{-1} = 0. Tracing 5 steps yields A:Q = 11111 01011 = -21.',
    },
    examTip: 'Always use Arithmetic Shift Right (preserve MSB sign bit of A) in Booth’s algorithm!',
  },
  {
    id: 'u3-l2',
    subjectId: 'unit-3',
    order: 2,
    title: 'Restoring & Non-Restoring Division Algorithms',
    summary:
      'Execute integer binary division using registers A, Q, M and counter n, contrasting restoring vs. non-restoring steps.',
    estimatedMinutes: 25,
    courseOutcome: 'CO3',
    keyPoints: [
      'Hardware registers: A (n+1 bit remainder, initially 0), Q (n-bit dividend → quotient), M (divisor), n (bit counter).',
      'Restoring Division steps: Shift left (A, Q); compute A ← A − M; if A < 0 set Q_0 = 0 and restore A ← A + M; else set Q_0 = 1; repeat n times.',
      'Non-Restoring Division skips the immediate restore step: if A < 0 on the next cycle, shift left and perform A ← A + M; final A < 0 requires one restore A ← A + M at the end.',
      'At termination, Q holds the Quotient and A holds the Remainder.',
    ],
    workedExample: {
      prompt: 'Trace 7 / 3 in 4-bit restoring division (Assignment 2 Q1).',
      solution:
        'A=00000, Q=0111, M=00011, n=4.\nStep 1: Shift (00000,111_), A-M < 0 → restore A=00000, Q0=0.\nStep 2: Shift (00001,110_), A-M < 0 → restore A=00001, Q0=0.\nStep 3: Shift (00011,100_), A-M=00000 ≥ 0 → Q0=1.\nStep 4: Shift (00001,001_), A-M < 0 → restore A=00001, Q0=0.\nFinal: Q = 0010 (2), A = 00001 (1).',
    },
    examTip: 'Assignment 2 Q1 asks for the division hardware block diagram, flowchart, and step trace—memorize A, Q, M, and n.',
  },
  {
    id: 'u3-l3',
    subjectId: 'unit-3',
    order: 3,
    title: 'Instruction Formats, Machine Instructions & Addressing Modes',
    summary:
      'Compare 3-, 2-, 1-, and 0-address instruction formats and apply Immediate, Direct, Indirect, Register, Indexed, and Relative addressing.',
    estimatedMinutes: 22,
    courseOutcome: 'CO3',
    keyPoints: [
      '3-Address (ADD R1, R2, R3): compact code, longer instructions. 2-Address (ADD R1, R2): overwrites one operand. 1-Address (ADD X): uses implicit Accumulator. 0-Address (ADD): uses stack TOS.',
      'LOAD/STORE are data-transfer instructions moving words between main memory and CPU registers (R1 ← M[5000], M[6000] ← R1).',
      'Addressing modes define how Effective Address (EA) is computed from the instruction address field.',
      'Immediate: operand is in the instruction. Direct: EA = A. Indirect: EA = M[A]. Register: operand in R. Indexed: EA = A + Index Reg. Relative: EA = PC + offset.',
    ],
    workedExample: {
      prompt: 'Evaluate X = (A + B) × (C + D) in 1-address vs 0-address (stack) instructions.',
      solution:
        '1-Address: LOAD A; ADD B; STORE T; LOAD C; ADD D; MUL T; STORE X.\n0-Address: PUSH A; PUSH B; ADD; PUSH C; PUSH D; ADD; MUL; POP X.',
    },
    examTip: 'CIE-2 SAQ 1 & 2 test arithmetic instruction RTL and LOAD/STORE data flow diagrams.',
  },
  {
    id: 'u3-l4',
    subjectId: 'unit-3',
    order: 4,
    title: 'Register Transfer Language (RTL) & Micro-operations',
    summary:
      'Write symbolic RTL statements for common-bus register transfers and arithmetic, logic, and shift micro-operations.',
    estimatedMinutes: 22,
    courseOutcome: 'CO3',
    keyPoints: [
      'RTL notation: registers in uppercase (R1, PC, AR); ← denotes transfer; conditional control precedes a colon (T1: R2 ← R1); memory written M[AR].',
      'Arithmetic micro-operations: Add (R3 ← R1 + R2), Subtract via 2\'s complement (R3 ← R1 + R2\' + 1), Increment (R1 ← R1 + 1), Decrement (R1 ← R1 − 1).',
      'Logic micro-operations: bitwise AND (mask/clear), OR (set bits), XOR (complement/toggle), and NOT.',
      'Shift micro-operations: shl/shr (0 enters vacated bit), ashr (preserves sign bit to divide signed integer by 2), cil/cir (circular rotate loses no bits).',
    ],
    table: {
      caption: 'Shift Micro-operations on 4-bit Register R = 1011',
      headers: ['Operation', 'Symbolic', 'Result on 1011', 'Key Property'],
      rows: [
        ['Logical Shift Left', 'shl R', '0110', '0 enters LSB; MSB lost'],
        ['Logical Shift Right', 'shr R', '0101', '0 enters MSB; LSB lost'],
        ['Arithmetic Shift Right', 'ashr R', '1101', 'Sign bit preserved (-5 → -3)'],
        ['Circular Shift Left', 'cil R', '0111', 'MSB wraps to LSB'],
        ['Circular Shift Right', 'cir R', '1101', 'LSB wraps to MSB'],
      ],
    },
    examTip: 'CIE-2 LAQ 1 asks for RTL plus examples of all four micro-operation families (register transfer, arithmetic, logic, shift).',
  },
  {
    id: 'u3-l5',
    subjectId: 'unit-3',
    order: 5,
    title: 'Microprogrammed Control & Address Sequencing',
    summary:
      'Design a microprogrammed control unit using Control Memory (ROM), CAR, CDR, SBR, and next-address sequencing.',
    estimatedMinutes: 24,
    courseOutcome: 'CO3',
    keyPoints: [
      'Hardwired control uses fixed combinational logic (fastest, inflexible); Microprogrammed control reads microinstructions from Control Memory (ROM) (flexible, slower).',
      'Key registers: CAR (Control Address Register), CDR / Microinstruction Register (holds current microinstruction F1|F2|F3|CD|BR|AD), SBR (Subroutine Return Register).',
      'Address sequencing choices: Increment (CAR ← CAR + 1), Unconditional/Conditional Branch (CAR ← AD), Opcode Mapping (CAR ← 0 | opcode | 00), Subroutine Call/Return (SBR ← CAR + 1).',
      'Fetch routine example: AR ← PC; DR ← M[AR], PC ← PC + 1; IR ← DR; then CAR ← mapped opcode address.',
    ],
    examTip: 'CIE-2 LAQ 2 & Assignment 2 Q4 both test the microprogrammed control block diagram, 20-bit format, and fetch microinstructions.',
  },

  // ================= UNIT IV =================
  {
    id: 'u4-l1',
    subjectId: 'unit-4',
    order: 1,
    title: 'Peripheral Devices & I/O Interface Organization',
    summary:
      'Understand why peripheral interfaces are needed and compare Isolated I/O vs. Memory-Mapped I/O addressing.',
    estimatedMinutes: 20,
    courseOutcome: 'CO4',
    keyPoints: [
      'Peripherals are electromechanical and orders of magnitude slower than the CPU, requiring an I/O Interface (controller) on the shared I/O bus.',
      'Four functions of an I/O interface: Address decoding, Data buffering/speed matching, Status & control signaling, and Serial↔Parallel format conversion.',
      'Isolated I/O uses separate IN/OUT instructions and an IO/M control pin, keeping full memory address space intact.',
      'Memory-Mapped I/O assigns device registers regular memory addresses so standard LOAD/STORE instructions access I/O.',
    ],
    table: {
      caption: 'Isolated I/O vs. Memory-Mapped I/O',
      headers: ['Aspect', 'Isolated I/O', 'Memory-Mapped I/O'],
      rows: [
        ['Address Space', 'Separate I/O & Memory spaces', 'Shared single address space'],
        ['Instructions', 'Dedicated IN / OUT opcodes', 'Standard LOAD / STORE / ADD'],
        ['Control Signals', 'Requires IO/M# line', 'Uses normal MEMR# / MEMW#'],
      ],
    },
    examTip: 'Draw the 4 internal registers of an I/O interface (Data, Status, Control, Address Decode) for CIE-2 LAQ 4.',
  },
  {
    id: 'u4-l2',
    subjectId: 'unit-4',
    order: 2,
    title: 'Modes of Data Transfer, Priority Interrupt & DMA',
    summary:
      'Compare Programmed I/O, Interrupt-Driven I/O, Daisy-Chain priority, and Direct Memory Access (DMA) controller handshaking.',
    estimatedMinutes: 26,
    courseOutcome: 'CO4',
    keyPoints: [
      'Programmed I/O: CPU continuously polls the status READY bit—wastes CPU cycles.',
      'Interrupt-Driven I/O: Device asserts IRQ when ready; CPU saves context and runs an Interrupt Service Routine (ISR). Daisy-chaining resolves simultaneous interrupts by physical priority.',
      'Direct Memory Access (DMA): DMAC takes over the system bus via BR/HOLD → BG/HLDA to move bulk blocks directly between I/O and RAM.',
      'DMAC registers: Address Register, Word Count Register, Control Register. Transfer modes: Burst (block), Cycle Stealing (1 word at a time), and Transparent (idle bus cycles).',
    ],
    workedExample: {
      prompt: 'Trace the 5-step DMA handshake sequence (CIE-2 SAQ 4 & Assignment 2 Q5).',
      solution:
        '1. CPU loads DMAC with start address, word count, and R/W direction.\n2. I/O asserts DMA Request; DMAC sends Bus Request (BR) to CPU.\n3. CPU finishes current bus cycle, tristates buses, and asserts Bus Grant (BG/HLDA).\n4. DMAC sends DMA Ack and transfers words directly, incrementing address & decrementing count.\n5. When count = 0, DMAC releases bus and interrupts CPU.',
    },
    examTip: 'Always mention BR/HOLD, BG/HLDA, and the three DMA modes (Burst, Cycle Stealing, Transparent).',
  },
  {
    id: 'u4-l3',
    subjectId: 'unit-4',
    order: 3,
    title: 'Memory Hierarchy, RAM/ROM & Main Memory Organization',
    summary:
      'Analyze the speed-cost-capacity pyramid from CPU Registers to Tape, SRAM vs. DRAM, ROM types, and 2^n × m RAM array decoding.',
    estimatedMinutes: 22,
    courseOutcome: 'CO4',
    keyPoints: [
      'Memory Hierarchy gives the illusion of a large, fast memory at low cost by exploiting Locality of Reference (Temporal & Spatial).',
      'Going down the hierarchy (Registers → Cache SRAM → Main DRAM → SSD/HDD → Tape): Access time increases, Capacity increases, Cost per bit decreases.',
      'SRAM (flip-flop cells, fast, no refresh, used for Cache) vs. DRAM (capacitor cells, dense/cheaper, requires periodic refresh, used for Main Memory).',
      'ROM is non-volatile firmware storage (PROM, EPROM, EEPROM, Flash). Main memory arrays use an n-to-2^n address decoder + MAR + MDR.',
    ],
    formulas: [
      'Effective Access Time: t_eff = h × t_c + (1 - h) × t_m',
    ],
    workedExample: {
      prompt: 'Find t_eff when cache hit ratio h = 0.95, cache access t_c = 10 ns, and main memory t_m = 100 ns.',
      solution: 't_eff = (0.95 × 10) + (0.05 × 100) = 9.5 + 5.0 = 14.5 ns.',
    },
    examTip: 'CIE-2 SAQ 5 & LAQ 5 test RAM vs ROM and the memory hierarchy pyramid with t_eff calculation.',
  },
  {
    id: 'u4-l4',
    subjectId: 'unit-4',
    order: 4,
    title: 'Cache Mapping: Direct, Associative & Set-Associative',
    summary:
      'Split CPU addresses into Tag, Index/Set, and Word Offset fields across Direct, Fully Associative, and k-Way Set-Associative caches.',
    estimatedMinutes: 28,
    courseOutcome: 'CO4',
    keyPoints: [
      'Direct Mapping: Block j maps strictly to line (j mod C). Address = Tag + Line Index + Word. Uses 1 comparator (cheap) but suffers conflict misses.',
      'Associative Mapping: Any block can sit in any cache line. Address = Tag + Word. Uses Content-Addressable Memory (CAM) comparing all tags in parallel; zero conflict misses, costly hardware.',
      'k-Way Set-Associative Mapping: Cache has S = C/k sets; block j maps to set (j mod S) and sits in any of its k lines. Address = Tag + Set + Word. Compares k tags per access.',
      'Replacement policies (when full): LRU (Least Recently Used), FIFO, Random. Write policies: Write-Through vs. Write-Back (dirty bit).',
    ],
    table: {
      caption: 'Cache Mapping Comparison (64K RAM, 16-word blocks, 128 cache lines)',
      headers: ['Technique', 'Placement', 'Address Split (16-bit)', 'Comparators', 'Cost'],
      rows: [
        ['Direct (k=1)', '1 fixed line (j mod 128)', 'Tag(5) + Line(7) + Word(4)', '1', 'Low'],
        ['Associative', 'Any cache line', 'Tag(12) + Word(4)', 'All 128', 'High'],
        ['2-Way Set-Assoc', 'Any of 2 lines in set (j mod 64)', 'Tag(6) + Set(6) + Word(4)', '2', 'Moderate'],
      ],
    },
    examTip: 'CIE-2 LAQ 6 specifically asks for Associative and Set-Associative mapping with a 64K-word / 16-bit address breakdown!',
  },
  {
    id: 'u4-l5',
    subjectId: 'unit-4',
    order: 5,
    title: 'Virtual Memory, Paging & Secondary Storage',
    summary:
      'Translate virtual addresses to physical frames via Page Tables & TLB, and review HDD/SSD secondary storage geometry.',
    estimatedMinutes: 18,
    courseOutcome: 'CO4',
    keyPoints: [
      'Virtual memory lets programs exceed physical RAM by keeping active pages in DRAM and inactive pages on disk/SSD.',
      'MMU translates Virtual Page Number (VPN) → Physical Frame Number (PFN) using a Page Table; a TLB (Translation Lookaside Buffer) caches recent translations.',
      'Page Fault occurs when a referenced page is not in RAM (Valid bit = 0), triggering OS disk swap.',
      'Secondary storage: Magnetic disks organize platters into tracks and sectors (Seek Time + Rotational Latency + Transfer Time); SSDs use NAND flash for sub-millisecond random access.',
    ],
    examTip: 'Distinguish Cache Miss (handled in hardware, ~ns) from Page Fault (handled by OS, ~ms).',
  },

  // ================= UNIT V =================
  {
    id: 'u5-l1',
    subjectId: 'unit-5',
    order: 1,
    title: 'RISC vs. CISC Characteristics & Design Trade-offs',
    summary:
      'Contrast Reduced Instruction Set Computers (ARM, RISC-V, MIPS) with Complex Instruction Set Computers (x86) across hardware and ISA dimensions.',
    estimatedMinutes: 20,
    courseOutcome: 'CO5',
    keyPoints: [
      'RISC emphasizes simple, fixed-length instructions completing mostly in 1 clock cycle, hardwired control, large register files, and Load/Store memory access.',
      'CISC emphasizes rich, variable-length instructions taking multiple clocks, microprogrammed control, many addressing modes, and direct memory-to-memory operations.',
      'RISC makes pipelining straightforward and efficient; CISC reduces code size (compact binaries) at the cost of complex decode stages.',
    ],
    table: {
      caption: 'RISC vs. CISC Comparison (CIE-2 SAQ 7 & Surprise Test 4 Q1)',
      headers: ['Feature', 'RISC', 'CISC'],
      rows: [
        ['Instruction Format', 'Small, simple, fixed-length', 'Large, complex, variable-length'],
        ['Execution Time', 'Mostly 1 clock/instruction', 'Multi-cycle, many clocks'],
        ['Control Unit', 'Hardwired', 'Microprogrammed (ROM)'],
        ['Memory Access', 'LOAD / STORE only', 'Any instruction can access memory'],
        ['Registers', 'Large general-purpose file', 'Fewer general-purpose registers'],
        ['Examples', 'ARM, MIPS, RISC-V', 'Intel x86, VAX'],
      ],
    },
    examTip: 'Both CIE-2 SAQ 7 and Surprise Test 4 Q1 directly test the RISC vs CISC comparison table.',
  },
  {
    id: 'u5-l2',
    subjectId: 'unit-5',
    order: 2,
    title: 'Instruction Pipelining Basics & Performance Speedup',
    summary:
      'Understand overlapped instruction execution across pipeline stages and compute cycle counts and speedup S.',
    estimatedMinutes: 22,
    courseOutcome: 'CO5',
    keyPoints: [
      'Pipelining overlaps independent stages (IF, ID, EX, MEM, WB) separated by inter-stage registers like an assembly line.',
      'Pipelining increases instruction throughput (1 instruction completed per clock once full), though single-instruction latency does not shrink.',
      'For k stages and n instructions: Non-pipelined = n · k cycles; Pipelined = (k + n − 1) cycles.',
      'Ideal Speedup S = (n · k) / (k + n − 1), approaching k as n → ∞. Hazards, unequal stage delays, and latch overhead limit real speedup.',
    ],
    formulas: [
      'Pipelined Cycles = k + n - 1',
      'Speedup S = (n × k) / (k + n - 1)',
    ],
    workedExample: {
      prompt: 'Compute cycles and speedup for k = 4 stages and n = 100 instructions (CIE-2 LAQ 7).',
      solution: 'Non-pipelined = 100 × 4 = 400 cycles. Pipelined = 4 + 100 - 1 = 103 cycles. Speedup S = 400 / 103 ≈ 3.88×.',
    },
    examTip: 'Remember: Pipelining improves throughput, NOT individual instruction latency.',
  },
  {
    id: 'u5-l3',
    subjectId: 'unit-5',
    order: 3,
    title: 'Pipelined Datapath & Control Considerations',
    summary:
      'Trace the 5-stage datapath with IF/ID, ID/EX, EX/MEM, and MEM/WB pipeline registers and stage-partitioned control signals.',
    estimatedMinutes: 24,
    courseOutcome: 'CO5',
    keyPoints: [
      'Inter-stage registers (IF/ID, ID/EX, EX/MEM, MEM/WB) isolate stages so 5 different instructions execute concurrently on each clock edge.',
      'Separate Instruction Memory and Data Memory (Harvard / split L1 cache) prevent structural conflicts between IF and MEM.',
      'The destination register specifier (Rd) must travel through ID/EX → EX/MEM → MEM/WB alongside data so WB writes back to the right register.',
      'Control signals are decoded once in ID and forwarded down pipeline registers: EX uses (RegDst, ALUOp, ALUSrc), MEM uses (Branch, MemRead, MemWrite), WB uses (RegWrite, MemtoReg).',
    ],
    table: {
      caption: 'Pipeline Control Signals by Stage (CIE-2 LAQ 8)',
      headers: ['Stage', 'Control Signals Consumed'],
      rows: [
        ['EX (Execute)', 'RegDst, ALUOp, ALUSrc'],
        ['MEM (Memory)', 'Branch, MemRead, MemWrite'],
        ['WB (Write Back)', 'RegWrite, MemtoReg'],
      ],
    },
    examTip: 'CIE-2 LAQ 8 & Surprise Test 4 Q3 ask for the 5-stage pipelined datapath diagram and control signal grouping.',
  },
  {
    id: 'u5-l4',
    subjectId: 'unit-5',
    order: 4,
    title: 'Pipeline Hazards, Forwarding & Superscalar Operation',
    summary:
      'Diagnose Structural, Data (RAW, WAR, WAW), and Control hazards, resolve them via forwarding/stalls/branch prediction, and explore superscalar issue.',
    estimatedMinutes: 26,
    courseOutcome: 'CO5',
    keyPoints: [
      'Structural Hazard: hardware resource conflict (solved by separate I/D caches and split-cycle register write-then-read).',
      'Data Hazards: RAW (true dependency—commonest in-order hazard), WAR (anti-dependency), and WAW (output dependency—in out-of-order pipelines).',
      'Mitigating Data Hazards: Data Forwarding (EX/MEM or MEM/WB → ALU input eliminates arithmetic RAW stalls; Load-Use still needs 1 stall), Stalls (NOP bubbles), Compiler Scheduling, and Register Renaming (removes WAR/WAW).',
      'Control (Instruction) Hazards: branches change PC; solved by pipeline flushing, early branch resolution in ID, delayed branching, or dynamic branch prediction.',
      'Superscalar Operation: processor fetches, decodes, and dispatches multiple independent instructions per clock across parallel execution pipelines (CPI < 1).',
    ],
    workedExample: {
      prompt: 'Identify the hazard between ADD R1, R2, R3 and SUB R4, R1, R5 (CIE-2 SAQ 9 & LAQ 9).',
      solution:
        'True RAW dependency on R1. Without forwarding, SUB needs R1 at ID (T3) while ADD writes R1 at WB (T5) → 2 stall cycles. With EX/MEM forwarding, 0 stalls!',
    },
    examTip: 'Remember: Even WITH forwarding, a Load-Use hazard (LW followed immediately by ADD) still requires 1 stall cycle.',
  },
];

export const DECO_FLASHCARDS: Flashcard[] = [
  // Unit I
  {
    id: 'fc-u1-1',
    subjectId: 'unit-1',
    tag: 'CPU Registers',
    front: 'Which CPU register holds the memory address of the next instruction to be executed?',
    back: 'The Program Counter (PC). During fetch, AR ← PC and PC ← PC + 1.',
  },
  {
    id: 'fc-u1-2',
    subjectId: 'unit-1',
    tag: 'Architecture',
    front: 'What is the Von Neumann Bottleneck?',
    back: 'Performance limitation caused by sharing a single memory space and shared bus between CPU instructions and data transfers.',
  },
  {
    id: 'fc-u1-3',
    subjectId: 'unit-1',
    tag: 'Multiprocessing',
    front: 'How does a Multiprocessor differ from a Multicomputer?',
    back: 'A multiprocessor shares a single global physical memory (tightly coupled); a multicomputer has private local memories per node communicating via message passing (loosely coupled).',
  },
  {
    id: 'fc-u1-4',
    subjectId: 'unit-1',
    tag: 'Performance',
    front: 'Write the CPU Execution Time formula in terms of Instruction Count (IC), CPI, and Clock Rate.',
    back: 'CPU Time = (IC × CPI) / Clock Rate = IC × CPI × Clock Cycle Time.',
  },
  {
    id: 'fc-u1-5',
    subjectId: 'unit-1',
    tag: 'Endianness',
    front: 'In Little-Endian format, which byte is stored at the lowest memory address?',
    back: 'The Least Significant Byte (LSB) is stored at the lowest memory address (MSB is stored at the lowest address in Big-Endian).',
  },
  {
    id: 'fc-u1-6',
    subjectId: 'unit-1',
    tag: 'Binary Codes',
    front: 'How do you convert Binary 110101 to Gray code?',
    back: 'Keep MSB (1), then XOR adjacent bits: 1⊕1=0, 1⊕0=1, 0⊕1=1, 1⊕0=1, 0⊕1=1 → Gray code = 101111.',
  },
  {
    id: 'fc-u1-7',
    subjectId: 'unit-1',
    tag: 'Signed Numbers',
    front: "Represent -18 in 8-bit 2's complement.",
    back: "+18 = 00010010 → invert bits (11101101) + 1 = 11101110.",
  },
  {
    id: 'fc-u1-8',
    subjectId: 'unit-1',
    tag: 'IEEE 754 & Hamming',
    front: 'What are the bit allocations and bias in IEEE 754 Single Precision (32-bit), and what is the Hamming redundancy rule?',
    back: 'IEEE 754 Single: 1 Sign + 8 Exponent (Bias = 127) + 23 Mantissa bits. Hamming Code requires 2^r >= m + r + 1 parity bits.',
  },

  // Unit II
  {
    id: 'fc-u2-1',
    subjectId: 'unit-2',
    tag: 'Boolean Algebra',
    front: "State De Morgan's two theorems and the Consensus theorem.",
    back: "(A + B)' = A'·B' and (A·B)' = A' + B'. Consensus theorem: AB + A'C + BC = AB + A'C.",
  },
  {
    id: 'fc-u2-2',
    subjectId: 'unit-2',
    tag: 'Logic Gates',
    front: 'Why are NAND and NOR called Universal Gates?',
    back: 'Any Boolean function (NOT, AND, OR, XOR, etc.) can be implemented using only NAND gates or only NOR gates.',
  },
  {
    id: 'fc-u2-3',
    subjectId: 'unit-2',
    tag: 'XOR / XNOR',
    front: 'What is the logical difference between XOR and XNOR?',
    back: 'XOR (A ⊕ B) outputs 1 when inputs differ; XNOR ((A ⊕ B)\') outputs 1 when all inputs are identical.',
  },
  {
    id: 'fc-u2-4',
    subjectId: 'unit-2',
    tag: 'Canonical Forms',
    front: 'If F(A,B,C) = Σm(1, 2, 7), what is its canonical POS form?',
    back: 'F(A,B,C) = ΠM(0, 3, 4, 5, 6) — the maxterms corresponding to the indices where F = 0.',
  },
  {
    id: 'fc-u2-5',
    subjectId: 'unit-2',
    tag: 'K-Map',
    front: 'What is an Essential Prime Implicant (EPI) in a K-Map?',
    back: 'A prime implicant that covers at least one minterm (1-cell) that cannot be covered by any other prime implicant.',
  },
  {
    id: 'fc-u2-6',
    subjectId: 'unit-2',
    tag: 'Full Adder',
    front: 'Give the Boolean expressions for a Full Adder Sum and Carry-out (Cout).',
    back: 'Sum = A ⊕ B ⊕ Cin; Cout = AB + Cin(A ⊕ B).',
  },
  {
    id: 'fc-u2-7',
    subjectId: 'unit-2',
    tag: 'Adder/Subtractor',
    front: 'How does the mode input M control a 4-bit binary adder/subtractor, and how is signed overflow detected?',
    back: 'M=0 passes B unchanged (S = A+B); M=1 complements B via XOR and sets Cin=1 (S = A+B\'+1 = A−B). Overflow V = C4 ⊕ C3.',
  },
  {
    id: 'fc-u2-8',
    subjectId: 'unit-2',
    tag: 'Sequential Circuits',
    front: 'What is the Race-Around Condition in a JK Flip-Flop and how is it eliminated?',
    back: 'When J=K=1 and clock pulse width > propagation delay, output toggles repeatedly. Fixed using Master-Slave or Edge-Triggered JK flip-flops.',
  },

  // Unit III
  {
    id: 'fc-u3-1',
    subjectId: 'unit-3',
    tag: "Booth's Algorithm",
    front: "What arithmetic action does Booth's algorithm take for (Q_0, Q_{-1}) = 10 vs 01?",
    back: '10 → Subtract multiplicand (A ← A − M) then ASR; 01 → Add multiplicand (A ← A + M) then ASR; 00 or 11 → ASR only.',
  },
  {
    id: 'fc-u3-2',
    subjectId: 'unit-3',
    tag: 'Division',
    front: 'In Restoring Division, what happens when A ← A − M produces A < 0?',
    back: 'Set quotient bit Q_0 = 0 and restore A by adding M back (A ← A + M) before decrementing counter n.',
  },
  {
    id: 'fc-u3-3',
    subjectId: 'unit-3',
    tag: 'Machine Instructions',
    front: 'What is the role of LOAD and STORE instructions in a Load/Store architecture?',
    back: 'LOAD copies a word from main memory into a CPU register (R1 ← M[addr]); STORE writes a CPU register back to main memory (M[addr] ← R1).',
  },
  {
    id: 'fc-u3-4',
    subjectId: 'unit-3',
    tag: 'Addressing Modes',
    front: 'Distinguish Direct, Indirect, Indexed, and Relative addressing modes.',
    back: 'Direct: EA = A. Indirect: EA = M[A]. Indexed: EA = A + Index Register. Relative: EA = PC + offset.',
  },
  {
    id: 'fc-u3-5',
    subjectId: 'unit-3',
    tag: 'RTL',
    front: 'What is Register Transfer Language (RTL) and what does T1: R2 ← R1 mean?',
    back: 'RTL symbolically describes micro-operations on registers. T1: R2 ← R1 copies R1 into R2 only when control signal T1 = 1.',
  },
  {
    id: 'fc-u3-6',
    subjectId: 'unit-3',
    tag: 'Shift Micro-ops',
    front: 'How does Arithmetic Shift Right (ashr) differ from Logical Shift Right (shr)?',
    back: 'shr shifts 0 into the MSB, whereas ashr preserves the MSB sign bit (performing signed division by 2).',
  },
  {
    id: 'fc-u3-7',
    subjectId: 'unit-3',
    tag: 'Microprogramming',
    front: 'Name the core registers in a Microprogrammed Control Unit and their purpose.',
    back: 'CAR (Control Address Register) holds next microinstruction address; Control Memory (ROM) stores microprograms; CDR holds current microinstruction; SBR saves return address.',
  },
  {
    id: 'fc-u3-8',
    subjectId: 'unit-3',
    tag: 'Control Unit',
    front: 'What is the main trade-off between Hardwired and Microprogrammed Control?',
    back: 'Hardwired is faster (gate-level) but hard to modify; Microprogrammed is slower (ROM lookup) but flexible and easy to update.',
  },

  // Unit IV
  {
    id: 'fc-u4-1',
    subjectId: 'unit-4',
    tag: 'I/O Interface',
    front: 'List four functions of an I/O Interface (controller).',
    back: '1) Address decoding, 2) Data buffering & speed matching, 3) Status & control signaling, 4) Serial↔parallel conversion & interrupt generation.',
  },
  {
    id: 'fc-u4-2',
    subjectId: 'unit-4',
    tag: 'I/O Addressing',
    front: 'Contrast Isolated I/O and Memory-Mapped I/O.',
    back: 'Isolated I/O uses a separate address space with IN/OUT instructions; Memory-Mapped I/O places I/O registers in main memory space using LOAD/STORE.',
  },
  {
    id: 'fc-u4-3',
    subjectId: 'unit-4',
    tag: 'DMA',
    front: 'What are BR/HOLD and BG/HLDA in Direct Memory Access (DMA), and why is DMA faster?',
    back: 'BR (Bus Request) is asserted by DMAC; CPU grants bus control via BG/HLDA. Bulk data moves directly I/O ↔ Memory without per-word CPU involvement.',
  },
  {
    id: 'fc-u4-4',
    subjectId: 'unit-4',
    tag: 'DMA Modes',
    front: 'Compare Burst Mode, Cycle Stealing, and Transparent Mode in DMA.',
    back: 'Burst transfers an entire block while blocking CPU; Cycle Stealing transfers one word per stolen bus cycle; Transparent transfers only when CPU is idle.',
  },
  {
    id: 'fc-u4-5',
    subjectId: 'unit-4',
    tag: 'RAM vs ROM',
    front: 'Give two differences between RAM and ROM.',
    back: 'RAM is volatile read/write memory for active programs/data (SRAM/DRAM); ROM is non-volatile mainly-read memory storing permanent boot firmware/BIOS.',
  },
  {
    id: 'fc-u4-6',
    subjectId: 'unit-4',
    tag: 'Cache Performance',
    front: 'Calculate effective memory access time for h = 0.95, cache t_c = 10 ns, RAM t_m = 100 ns.',
    back: 't_eff = h·t_c + (1−h)·t_m = 0.95(10) + 0.05(100) = 9.5 + 5 = 14.5 ns.',
  },
  {
    id: 'fc-u4-7',
    subjectId: 'unit-4',
    tag: 'Cache Mapping',
    front: 'How is a 16-bit address split for 64K RAM, 16-word blocks, and 128 cache lines under 2-way Set-Associative mapping?',
    back: '16-word block → 4 Word bits; 128/2 = 64 sets → 6 Set bits; remaining 16 − 6 − 4 = 6 Tag bits.',
  },
  {
    id: 'fc-u4-8',
    subjectId: 'unit-4',
    tag: 'Memory Hierarchy',
    front: 'Which two principles of Locality of Reference make Cache Memory effective?',
    back: 'Temporal locality (recently accessed items are likely accessed again soon) and Spatial locality (nearby memory addresses are likely accessed soon).',
  },

  // Unit V
  {
    id: 'fc-u5-1',
    subjectId: 'unit-5',
    tag: 'RISC vs CISC',
    front: 'State 4 defining characteristics of a RISC processor.',
    back: 'Simple fixed-length instructions, single-cycle execution, hardwired control, Load/Store memory access only, large register file, easy pipelining.',
  },
  {
    id: 'fc-u5-2',
    subjectId: 'unit-5',
    tag: 'RISC vs CISC',
    front: 'Why is CISC harder to pipeline than RISC?',
    back: 'CISC instructions have variable lengths, complex multi-cycle microprograms, and direct memory operands, causing uneven pipeline stage delays.',
  },
  {
    id: 'fc-u5-3',
    subjectId: 'unit-5',
    tag: 'Pipelining',
    front: 'What is the pipeline speedup formula S for k stages and n instructions?',
    back: 'S = (n · k) / (k + n − 1). For k=4, n=100: 400 / 103 ≈ 3.88.',
  },
  {
    id: 'fc-u5-4',
    subjectId: 'unit-5',
    tag: 'Pipelined Datapath',
    front: 'Name the four pipeline registers in a 5-stage RISC datapath and the control signals used in MEM and WB.',
    back: 'Registers: IF/ID, ID/EX, EX/MEM, MEM/WB. MEM uses Branch, MemRead, MemWrite; WB uses RegWrite, MemtoReg.',
  },
  {
    id: 'fc-u5-5',
    subjectId: 'unit-5',
    tag: 'Data Hazards',
    front: 'Differentiate RAW, WAR, and WAW data hazards.',
    back: 'RAW (Read After Write): true dependency; WAR (Write After Read): anti-dependency; WAW (Write After Write): output dependency (only in out-of-order/multicycle).',
  },
  {
    id: 'fc-u5-6',
    subjectId: 'unit-5',
    tag: 'Hazard Resolution',
    front: 'Why does a Load-Use hazard still need 1 stall cycle even with Data Forwarding?',
    back: 'Because LOAD data only becomes available after the MEM stage (T4), whereas the next dependent instruction needs it at the start of EX (T4 without stall).',
  },
  {
    id: 'fc-u5-7',
    subjectId: 'unit-5',
    tag: 'Control Hazards',
    front: 'How are Control (Branch) Hazards minimized in a pipelined CPU?',
    back: 'Early branch target/condition evaluation in ID, dynamic branch prediction, delayed branching, or flushing fetched wrong-path instructions.',
  },
  {
    id: 'fc-u5-8',
    subjectId: 'unit-5',
    tag: 'Superscalar',
    front: 'What defines a Superscalar processor?',
    back: 'A processor with multiple parallel execution units capable of fetching, decoding, and completing more than one instruction per clock cycle (CPI < 1).',
  },
];

export const SEEDED_DECO_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-seed-1',
    title: 'DECO Assignment 2 Final Submission & Viva',
    subjectId: 'unit-3',
    kind: 'assignment',
    dueDate: '2026-11-21',
    notes: 'Review Division Algorithm flowchart, I/O peripheral diagram, Memory Hierarchy, Microprogramming, and DMA.',
    completed: false,
    isSeeded: true,
    updatedAtMs: 1700000000000,
  },
  {
    id: 'rem-seed-2',
    title: 'CIE-2 Internal Examination (Units III, IV, V)',
    subjectId: 'unit-4',
    kind: 'exam',
    dueDate: '2026-11-25',
    notes: 'Focus on CIE-2 Question Bank SAQ 1–9 & LAQ 1–9 (RTL, Microprogrammed Control, DMA, Cache Mapping, Hazards).',
    completed: false,
    isSeeded: true,
    updatedAtMs: 1700000000000,
  },
  {
    id: 'rem-seed-3',
    title: 'Surprise Test 4 Revision: Pipelining & Superscalar',
    subjectId: 'unit-5',
    kind: 'quiz',
    dueDate: '2026-11-28',
    notes: 'Practice 5-stage datapath registers, speedup math, and RAW forwarding vs Load-Use stall diagrams.',
    completed: false,
    isSeeded: true,
    updatedAtMs: 1700000000000,
  },
  {
    id: 'rem-seed-4',
    title: 'Unit I & II Comprehensive K-Map & Complement Drill',
    subjectId: 'unit-2',
    kind: 'revision',
    dueDate: '2026-12-03',
    notes: 'Re-solve Quiz 01 & Assignment 1 (base conversions, Binary-to-Gray, SOP/POS, 4-var K-Map, Adder/Subtractor).',
    completed: false,
    isSeeded: true,
    updatedAtMs: 1700000000000,
  },
  {
    id: 'rem-seed-5',
    title: 'Semester End Examination (SEE) — U24EC304',
    subjectId: 'all',
    kind: 'exam',
    dueDate: '2026-12-14',
    notes: 'Full syllabus (60 Marks): Units I through V. Aim for 100% lesson and flashcard mastery.',
    completed: false,
    isSeeded: true,
    updatedAtMs: 1700000000000,
  },
];
