import type { McqQuestion } from '../types/study';

export const DECO_MCQS: McqQuestion[] = [
  // ================= UNIT I (5 MCQs) =================
  {
    id: 'mcq-u1-1',
    subjectId: 'unit-1',
    topic: 'Quiz 01 · Number Systems',
    question: 'Which of the following number systems is NOT positional?',
    options: ['Decimal', 'Binary', 'Roman', 'Octal'],
    correctIndex: 2,
    explanation:
      'Roman numerals are non-positional because symbol values do not depend strictly on radix power positions like Decimal (base 10), Binary (base 2), or Octal (base 8).',
  },
  {
    id: 'mcq-u1-2',
    subjectId: 'unit-1',
    topic: 'Quiz 01 · CPU Registers',
    question: 'Which CPU register holds the memory address of the next instruction to be executed?',
    options: [
      'MAR (Memory Address Register)',
      'PC (Program Counter)',
      'IR (Instruction Register)',
      'AC (Accumulator)',
    ],
    correctIndex: 1,
    explanation:
      'The Program Counter (PC) tracks the address of the next instruction to fetch; during each fetch cycle PC transfers to MAR and increments.',
  },
  {
    id: 'mcq-u1-3',
    subjectId: 'unit-1',
    topic: 'Quiz 01 · Data Representation',
    question: 'What is the 8-bit binary representation of the hexadecimal number 2F?',
    options: ['00101110', '11111111', '00101111', '00001111'],
    correctIndex: 2,
    explanation:
      'Each hex digit expands to 4 binary bits: 2 = 0010 and F (15) = 1111, giving 00101111.',
  },
  {
    id: 'mcq-u1-4',
    subjectId: 'unit-1',
    topic: 'Quiz 01 · Complements',
    question: "In a 2's complement representation, the negative of a binary number is obtained by:",
    options: [
      'Inverting all bits only',
      'Inverting all bits and subtracting 1',
      'Inverting all bits and adding 1',
      'Flipping only the sign bit',
    ],
    correctIndex: 2,
    explanation:
      "2's complement equals 1's complement (bitwise inversion) plus 1, which gives a unique zero and allows addition/subtraction with the same adder hardware.",
  },
  {
    id: 'mcq-u1-5',
    subjectId: 'unit-1',
    topic: 'Unit I · Error Detection & Correction',
    question: 'Hamming Code is primarily used in digital computer systems for:',
    options: [
      'Data compression',
      'Error detection and single-bit error correction',
      'Floating-point normalization',
      'Decimal-to-BCD conversion',
    ],
    correctIndex: 1,
    explanation:
      'Hamming Code inserts parity bits at power-of-two positions (1, 2, 4, 8...) to detect double-bit errors and locate/correct any single-bit error.',
  },

  // ================= UNIT II (5 MCQs) =================
  {
    id: 'mcq-u2-1',
    subjectId: 'unit-2',
    topic: 'Unit II · Universal Gates',
    question: 'Which pair of logic gates are known as Universal Gates because any Boolean function can be built from either alone?',
    options: ['AND and OR', 'XOR and XNOR', 'NAND and NOR', 'NOT and Buffer'],
    correctIndex: 2,
    explanation:
      'Both NAND and NOR are functionally complete (Universal Gates): NOT, AND, and OR can all be synthesized using only NAND gates or only NOR gates.',
  },
  {
    id: 'mcq-u2-2',
    subjectId: 'unit-2',
    topic: 'Unit II · Boolean Laws',
    question: 'Which Boolean algebra law is represented by the identity A + A = A and A · A = A?',
    options: ["De Morgan's Law", 'Idempotent Law', 'Distributive Law', 'Absorption Law'],
    correctIndex: 1,
    explanation:
      'The Idempotent Law states that ORing or ANDing a Boolean variable with itself returns the same variable (A + A = A, A · A = A).',
  },
  {
    id: 'mcq-u2-3',
    subjectId: 'unit-2',
    topic: 'Unit II · Combinational Logic',
    question: 'The output of a 2-input XOR gate is HIGH (1) when:',
    options: [
      'Both inputs are 0',
      'Both inputs are 1',
      'The two inputs are different (one 0 and one 1)',
      'At least one input is 0',
    ],
    correctIndex: 2,
    explanation:
      "Exclusive-OR (A ⊕ B = A'B + AB') outputs 1 only when the inputs differ, and 0 when both inputs are identical.",
  },
  {
    id: 'mcq-u2-4',
    subjectId: 'unit-2',
    topic: 'Surprise Test 2 · Full Adder',
    question: 'For a Full Adder with inputs A, B, and Cin, what is the Boolean expression for Sum?',
    options: ['A · B · Cin', 'A ⊕ B ⊕ Cin', 'AB + BCin + ACin', '(A + B) · Cin'],
    correctIndex: 1,
    explanation:
      'A Full Adder produces Sum = A ⊕ B ⊕ Cin and Carry-out Cout = AB + Cin(A ⊕ B).',
  },
  {
    id: 'mcq-u2-5',
    subjectId: 'unit-2',
    topic: 'Unit II · Multiplexers',
    question: 'How many select lines are required for an 8-to-1 Multiplexer (MUX)?',
    options: ['2', '3', '4', '8'],
    correctIndex: 1,
    explanation:
      'A 2^n-to-1 multiplexer requires n select lines; since 8 = 2^3, an 8:1 MUX uses 3 select lines.',
  },

  // ================= UNIT III (5 MCQs) =================
  {
    id: 'mcq-u3-1',
    subjectId: 'unit-3',
    topic: 'Unit III · Binary Arithmetic',
    question: "Booth's multiplication algorithm is primarily designed to multiply:",
    options: [
      'Unsigned floating-point numbers only',
      "Signed integers in 2's complement representation",
      'BCD-encoded decimal digits',
      'Single-precision mantissas without signs',
    ],
    correctIndex: 1,
    explanation:
      "Booth's algorithm inspects adjacent multiplier bit pairs (Q0, Q-1) to multiply signed 2's complement numbers uniformly and skip strings of 1s.",
  },
  {
    id: 'mcq-u3-2',
    subjectId: 'unit-3',
    topic: 'CIE-2 · Data Transfer Instructions',
    question: 'In a load/store architecture, which pair of instructions moves data between Main Memory and CPU registers?',
    options: ['ADD and SUB', 'PUSH and JUMP', 'LOAD and STORE', 'AND and XOR'],
    correctIndex: 2,
    explanation:
      'LOAD transfers data from memory into a CPU register (R1 ← M[addr]), while STORE writes a CPU register back to memory (M[addr] ← R1).',
  },
  {
    id: 'mcq-u3-3',
    subjectId: 'unit-3',
    topic: 'CIE-2 · Shift Micro-operations',
    question: 'Which shift micro-operation preserves the sign bit when dividing a signed number by 2?',
    options: [
      'Logical shift left (shl)',
      'Logical shift right (shr)',
      'Arithmetic shift right (ashr)',
      'Circular shift left (cil)',
    ],
    correctIndex: 2,
    explanation:
      'Arithmetic shift right (ashr) shifts bits right while replicating the MSB sign bit into the vacated position, preserving signed negativity.',
  },
  {
    id: 'mcq-u3-4',
    subjectId: 'unit-3',
    topic: 'CIE-2 · Microprogrammed Control',
    question: 'In a microprogrammed control unit, what does the Control Address Register (CAR) hold?',
    options: [
      'The address of the next user program instruction in RAM',
      'The address of the next microinstruction in Control Memory (ROM)',
      'The ALU carry-out status bit',
      'The peripheral DMA word count',
    ],
    correctIndex: 1,
    explanation:
      'CAR points to the next microinstruction to fetch from Control Memory; the sequencer updates CAR via increment, branch, mapping, or subroutine return.',
  },
  {
    id: 'mcq-u3-5',
    subjectId: 'unit-3',
    topic: 'CIE-2 · Adder/Subtractor',
    question: 'In a 4-bit binary adder/subtractor using XOR gates on B inputs and mode bit M, subtraction A - B is performed when:',
    options: [
      'M = 0 and initial carry C0 = 0',
      'M = 1 and initial carry C0 = 1',
      'M = 1 and initial carry C0 = 0',
      'M = 0 and initial carry C0 = 1',
    ],
    correctIndex: 1,
    explanation:
      "When M = 1, each XOR computes B ⊕ 1 = B' and C0 = 1 adds the +1 needed for 2's complement subtraction: A + B' + 1 = A - B.",
  },

  // ================= UNIT IV (5 MCQs) =================
  {
    id: 'mcq-u4-1',
    subjectId: 'unit-4',
    topic: 'CIE-2 · Direct Memory Access',
    question: 'During a DMA transfer between an I/O peripheral and Main Memory, which signals negotiate bus control with the CPU?',
    options: [
      'IF and WB',
      'BR/HOLD and BG/HLDA',
      'IN and OUT',
      'CAR and SBR',
    ],
    correctIndex: 1,
    explanation:
      'The DMA controller asserts Bus Request (BR/HOLD) and waits for the CPU to return Bus Grant (BG/HLDA) before transferring blocks directly over the system bus.',
  },
  {
    id: 'mcq-u4-2',
    subjectId: 'unit-4',
    topic: 'Unit IV · I/O Addressing',
    question: 'In Memory-Mapped I/O, how does the CPU communicate with peripheral device registers?',
    options: [
      'Using dedicated IN and OUT instructions in a separate I/O space',
      'Using standard memory LOAD/STORE instructions sharing the memory address space',
      'Only through the Control Memory ROM',
      'Only via arithmetic shift instructions',
    ],
    correctIndex: 1,
    explanation:
      'Memory-Mapped I/O assigns device registers addresses within the same address space as main memory, so ordinary LOAD/STORE instructions access I/O.',
  },
  {
    id: 'mcq-u4-3',
    subjectId: 'unit-4',
    topic: 'CIE-2 · Primary Memory',
    question: 'Which statement accurately distinguishes RAM from ROM?',
    options: [
      'RAM is non-volatile firmware storage; ROM is volatile workspace memory',
      'RAM is volatile read/write working memory; ROM is non-volatile permanent storage (e.g., BIOS)',
      'Both RAM and ROM lose all contents immediately when power turns off',
      'ROM is built from flip-flops inside the ALU',
    ],
    correctIndex: 1,
    explanation:
      'RAM (DRAM/SRAM) is volatile read/write memory for active programs/data, whereas ROM retains boot firmware permanently across power loss.',
  },
  {
    id: 'mcq-u4-4',
    subjectId: 'unit-4',
    topic: 'CIE-2 · Cache Performance',
    question: 'If cache hit ratio h = 0.95, cache access time tc = 10 ns, and main memory access time tm = 100 ns, what is the effective access time?',
    options: ['10.0 ns', '14.5 ns', '55.0 ns', '95.5 ns'],
    correctIndex: 1,
    explanation:
      'Effective access time = h·tc + (1 - h)·tm = (0.95 × 10) + (0.05 × 100) = 9.5 + 5.0 = 14.5 ns.',
  },
  {
    id: 'mcq-u4-5',
    subjectId: 'unit-4',
    topic: 'CIE-2 · Cache Mapping',
    question: 'In a 16-bit byte/word address with 16-word blocks and a 128-line 2-way set-associative cache (64 sets), how is the address split?',
    options: [
      'Tag (12) + Word (4)',
      'Tag (6) + Set (6) + Word (4)',
      'Tag (5) + Line (7) + Word (4)',
      'Tag (8) + Set (4) + Word (4)',
    ],
    correctIndex: 1,
    explanation:
      '16 words/block uses 4 Word bits; 64 sets (128 lines / 2 ways) uses 6 Set bits; remaining 16 - 6 - 4 = 6 bits form the Tag.',
  },

  // ================= UNIT V (5 MCQs) =================
  {
    id: 'mcq-u5-1',
    subjectId: 'unit-5',
    topic: 'Surprise Test 4 · RISC vs CISC',
    question: 'Which characteristic belongs to a RISC (Reduced Instruction Set Computer) architecture?',
    options: [
      'Variable-length instructions with memory-to-memory ALU operands',
      'Microprogrammed control unit with fewer general-purpose registers',
      'Fixed-length instructions, hardwired control, and LOAD/STORE-only memory access',
      'Multi-cycle complex instructions optimized to avoid pipelining',
    ],
    correctIndex: 2,
    explanation:
      'RISC emphasizes simple fixed-length instructions, hardwired control, large register files, and LOAD/STORE-only memory access for high pipeline efficiency.',
  },
  {
    id: 'mcq-u5-2',
    subjectId: 'unit-5',
    topic: 'CIE-2 · Pipeline Speedup',
    question: 'In an ideal 4-stage pipeline (k = 4) executing n = 100 instructions, how many clock cycles are required?',
    options: ['100 cycles', '103 cycles', '396 cycles', '400 cycles'],
    correctIndex: 1,
    explanation:
      'A k-stage pipeline takes (k + n - 1) cycles for n instructions: 4 + 100 - 1 = 103 cycles (compared to 400 non-pipelined cycles).',
  },
  {
    id: 'mcq-u5-3',
    subjectId: 'unit-5',
    topic: 'CIE-2 · Pipeline Hazards',
    question: 'Which data hazard occurs when an instruction tries to read a register before an earlier instruction writes its result?',
    options: [
      'RAW (Read After Write — true dependency)',
      'WAR (Write After Read — anti-dependency)',
      'WAW (Write After Write — output dependency)',
      'Structural bus hazard',
    ],
    correctIndex: 0,
    explanation:
      'RAW (Read After Write) is a true data dependency and the primary data hazard in simple in-order pipelines.',
  },
  {
    id: 'mcq-u5-4',
    subjectId: 'unit-5',
    topic: 'Unit V · Load-Use Hazard',
    question: 'Why does LW followed immediately by a dependent ADD still require 1 stall cycle even when data forwarding is implemented?',
    options: [
      'Because LW decodes in WB instead of ID',
      'Because LW data is only available after the MEM stage (T4), too late for ADD EX without 1 stall',
      'Because forwarding only works for branch instructions',
      'Because the Program Counter freezes during memory writes',
    ],
    correctIndex: 1,
    explanation:
      'Memory data from LW arrives at the end of MEM (T4), whereas a back-to-back ADD needs that operand at the start of EX (T4), requiring 1 stall bubble.',
  },
  {
    id: 'mcq-u5-5',
    subjectId: 'unit-5',
    topic: 'CIE-2 · Pipelined Control',
    question: 'In a 5-stage MIPS-style pipelined datapath, which control signals are consumed during the WB (Write-Back) stage?',
    options: [
      'RegDst, ALUOp, ALUSrc',
      'Branch, MemRead, MemWrite',
      'RegWrite and MemtoReg',
      'PCWrite and IF/IDFlush',
    ],
    correctIndex: 2,
    explanation:
      'Control signals are decoded in ID and passed forward in pipeline registers: EX uses RegDst/ALUOp/ALUSrc, MEM uses Branch/MemRead/MemWrite, and WB uses RegWrite/MemtoReg.',
  },
];
