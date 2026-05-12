# GPA Conversion Research for Study-Abroad Calculator

> Research compiled April 2026. Sources include WES official documentation, gpacalculator.net, SmartCGPA, ChaseDream, Crimson Education, and various credential evaluation resources.

---

## Table of Contents

1. [Chinese Grading Systems](#1-chinese-grading-systems)
2. [UK Grading System](#2-uk-grading-system)
3. [Australian Grading System](#3-australian-grading-system)
4. [Canadian Grading System](#4-canadian-grading-system)
5. [Indian Grading System](#5-indian-grading-system)
6. [Hong Kong Grading System](#6-hong-kong-grading-system)
7. [European/German Grading System](#7-europeangerman-grading-system)
8. [Japanese Grading System](#8-japanese-grading-system)
9. [Korean Grading System](#9-korean-grading-system)
10. [IB Diploma](#10-ib-diploma)
11. [A-Level](#11-a-level)
12. [WES Methodology & Rules](#12-wes-methodology--rules)
13. [WES vs ECE vs Other Services](#13-wes-vs-ece-vs-other-services)
14. [Target Scales Used by Universities](#14-target-scales-used-by-universities)
15. [Weighted vs Unweighted GPA](#15-weighted-vs-unweighted-gpa)
16. [Implementation Notes for Calculator](#16-implementation-notes-for-calculator)

---

## 1. Chinese Grading Systems

China has NO nationally mandated GPA scale. Different universities use different conversion algorithms. The Ministry of Education does not enforce a single standard, which is why multiple algorithms exist.

### 1.1 Standard 4.0 Algorithm (标准4.0算法)

The simplest and most conservative conversion. Used as a baseline.

| Percentage | Letter Grade | GPA |
|-----------|-------------|-----|
| 90-100 | A (优秀) | 4.0 |
| 80-89 | B (良好) | 3.0 |
| 70-79 | C (中等) | 2.0 |
| 60-69 | D (及格) | 1.0 |
| 0-59 | F (不及格) | 0.0 |

**Drawback:** Very coarse granularity. A student scoring 89% gets the same GPA as one scoring 80%.

### 1.2 Peking University Algorithm (北大4.0算法)

The most commonly referenced "fine-grained" algorithm in Chinese study-abroad communities. Divides scores into more brackets.

| Percentage | GPA |
|-----------|-----|
| 90-100 | 4.0 |
| 85-89 | 3.7 |
| 82-84 | 3.3 |
| 78-81 | 3.0 |
| 75-77 | 2.7 |
| 72-74 | 2.3 |
| 68-71 | 2.0 |
| 64-67 | 1.5 |
| 60-63 | 1.0 |
| 0-59 | 0.0 |

**Note:** This is very popular among Chinese applicants because it produces higher GPAs for students with scores in the 80s range compared to the standard algorithm.

### 1.3 PKU Nonlinear Formula

Some sources reference a continuous nonlinear formula used by PKU:

```
GPA = 4 - 3 * (100 - X)^2 / 1600    (for X >= 60)
GPA = 0                                (for X < 60)
```

Where X is the percentage score. This produces a curve that is more generous at higher scores.

**Sample outputs:**
| Score (X) | GPA |
|-----------|-----|
| 100 | 4.0 |
| 95 | 3.953 |
| 90 | 3.813 |
| 85 | 3.578 |
| 80 | 3.25 |
| 75 | 2.828 |
| 70 | 2.313 |
| 65 | 1.703 |
| 60 | 1.0 |

### 1.4 Modified Algorithm 1 (改良4.0算法-1)

| Percentage | GPA |
|-----------|-----|
| 85-100 | 4.0 |
| 70-84 | 3.0 |
| 60-69 | 2.0 |
| 0-59 | 0.0 |

### 1.5 Modified Algorithm 2 (改良4.0算法-2)

| Percentage | GPA |
|-----------|-----|
| 85-100 | 4.0 |
| 75-84 | 3.0 |
| 60-74 | 2.0 |
| 0-59 | 0.0 |

### 1.6 WES Algorithm for China (WES算法)

WES uses a broader, more conservative conversion for Chinese transcripts:

| Percentage | WES Grade | GPA |
|-----------|----------|-----|
| 85-100 | A | 4.0 |
| 75-84 | B | 3.0 |
| 60-74 | C | 2.0 |
| Below 60 | D/F | 1.0/0.0 |

**Important:** WES's official evaluation is more nuanced than this table suggests. The actual WES course-by-course evaluation considers institution-specific factors. This table is the simplified version commonly reported.

### 1.7 Canadian 4.3 Scale (加拿大4.3算法)

Used when applying to Canadian universities. More granular.

| Percentage | GPA (4.3) |
|-----------|----------|
| 90-100 | 4.3 |
| 85-89 | 4.0 |
| 80-84 | 3.7 |
| 75-79 | 3.3 |
| 70-74 | 3.0 |
| 65-69 | 2.7 |
| 60-64 | 2.3 |
| 0-59 | 0.0 |

### 1.8 USTC 4.3 Scale (中科大4.3算法)

Most granular of the common algorithms, with 14 brackets:

| Percentage | GPA (4.3) |
|-----------|----------|
| 95-100 | 4.3 |
| 90-94 | 4.0 |
| 85-89 | 3.7 |
| 82-84 | 3.3 |
| 78-81 | 3.0 |
| 75-77 | 2.7 |
| 72-74 | 2.3 |
| 68-71 | 2.0 |
| 66-67 | 1.7 |
| 64-65 | 1.5 |
| 62-63 | 1.3 |
| 60-61 | 1.0 |
| 0-59 | 0.0 |

### 1.9 SJTU 4.3 Scale (上海交大4.3算法)

| Percentage | GPA (4.3) |
|-----------|----------|
| 95-100 | 4.3 |
| 90-94 | 4.0 |
| 85-89 | 3.7 |
| 80-84 | 3.3 |
| 75-79 | 3.0 |
| 70-74 | 2.7 |
| 67-69 | 2.3 |
| 65-66 | 2.0 |
| 62-64 | 1.7 |
| 60-61 | 1.0 |
| 0-59 | 0.0 |

### 1.10 Chinese Letter Grade System (等级制)

Some universities (notably some PKU and Tsinghua programs) use letter grades instead of percentages:

| Letter | GPA |
|--------|-----|
| A | 4.0 |
| A- | 3.7 |
| B+ | 3.3 |
| B | 3.0 |
| B- | 2.7 |
| C+ | 2.3 |
| C | 2.0 |
| C- | 1.7 |
| D+ | 1.3 |
| D | 1.0 |
| F | 0.0 |

### 1.11 Five-Point Scale (五分制)

Some older Chinese universities use a 5-point scale:

| Score | GPA |
|-------|-----|
| 5 | 4.0 |
| 4 | 3.0 |
| 3 | 2.0 |
| 2 | 1.0 |
| 1/0 | 0.0 |

---

## 2. UK Grading System

### 2.1 UK Degree Classifications to US GPA

UK marking is notoriously harsh. A First Class (70%+) is considered equivalent to a US A, even though 70% seems low by other countries' standards.

| Classification | Percentage | US GPA Equivalent |
|---------------|-----------|-------------------|
| First Class Honours | 70%+ | 3.7-4.0 |
| Upper Second (2:1) | 60-69% | 3.3-3.7 |
| Lower Second (2:2) | 50-59% | 2.7-3.0 |
| Third Class | 40-49% | 2.0-2.3 |
| Ordinary Pass | 35-39% | 1.0-2.0 |
| Fail | Below 35% | 0.0 |

### 2.2 UK Percentage to US GPA (Fine-Grained)

For calculators that need more granularity:

| UK Percentage | US GPA |
|--------------|--------|
| 75-100 | 4.0 |
| 70-74 | 3.7 |
| 65-69 | 3.5 |
| 60-64 | 3.3 |
| 55-59 | 3.0 |
| 50-54 | 2.7 |
| 45-49 | 2.3 |
| 40-44 | 2.0 |
| 35-39 | 1.3 |
| 0-34 | 0.0 |

---

## 3. Australian Grading System

### 3.1 Letter Grade Scale (HD/D/C/P/F)

| Australian Grade | Percentage | US GPA |
|-----------------|-----------|--------|
| High Distinction (HD) | 85-100% | 4.0 |
| Distinction (D) | 75-84% | 3.5-3.9 |
| Credit (C) | 65-74% | 3.0-3.4 |
| Pass (P) | 50-64% | 2.0-2.9 |
| Fail (F) | Below 50% | 0.0 |

### 3.2 Australian 7-Point Scale

Used by some universities (e.g., University of Queensland):

| Grade | GPA (7-pt) | US GPA (4.0) |
|-------|-----------|-------------|
| 7 (HD) | 7.0 | 4.0 |
| 6 (D) | 6.0 | 3.7 |
| 5 (C) | 5.0 | 3.0 |
| 4 (P) | 4.0 | 2.3 |
| 3 (Conceded Pass) | 3.0 | 1.5 |
| 2 (F) | 2.0 | 0.0 |
| 1 (F) | 1.0 | 0.0 |

**Conversion formula (approximate):** US GPA = (Australian 7pt GPA - 1) * (4.0 / 6.0)

---

## 4. Canadian Grading System

Canada has no single national standard. Each province uses different scales.

### 4.1 Ontario (Most Common Reference)

| Percentage | Letter | GPA (4.0) |
|-----------|--------|----------|
| 90-100% | A+ | 4.0 |
| 85-89% | A | 4.0 |
| 80-84% | A- | 3.7 |
| 77-79% | B+ | 3.3 |
| 73-76% | B | 3.0 |
| 70-72% | B- | 2.7 |
| 67-69% | C+ | 2.3 |
| 63-66% | C | 2.0 |
| 60-62% | C- | 1.7 |
| 57-59% | D+ | 1.3 |
| 53-56% | D | 1.0 |
| 50-52% | D- | 0.7 |
| 0-49% | F | 0.0 |

### 4.2 Alberta

| Percentage | Letter | GPA (4.0) |
|-----------|--------|----------|
| 95-100% | A+ | 4.0 |
| 86-94% | A | 4.0 |
| 80-85% | A- | 3.7 |
| 76-79% | B+ | 3.3 |
| 70-75% | B | 3.0 |
| 65-69% | B- | 2.7 |
| 60-64% | C+ | 2.3 |
| 55-59% | C | 2.0 |
| 50-54% | C- | 1.7 |
| 0-49% | F | 0.0 |

### 4.3 British Columbia

| Percentage | Letter | GPA (4.0) |
|-----------|--------|----------|
| 90-100% | A+ | 4.33 |
| 86-89% | A | 4.0 |
| 80-85% | A- | 3.67 |
| 76-79% | B+ | 3.33 |
| 72-75% | B | 3.0 |
| 68-71% | B- | 2.67 |
| 64-67% | C+ | 2.33 |
| 60-63% | C | 2.0 |
| 55-59% | C- | 1.67 |
| 50-54% | D | 1.0 |
| 0-49% | F | 0.0 |

### 4.4 Canadian 4.3 Scale (Used by Some Universities)

Some Canadian universities use a 4.3 maximum GPA scale:

| Letter | GPA (4.3) | GPA (4.0) |
|--------|----------|----------|
| A+ | 4.3 | 4.0 |
| A | 4.0 | 4.0 |
| A- | 3.7 | 3.7 |
| B+ | 3.3 | 3.3 |
| B | 3.0 | 3.0 |
| B- | 2.7 | 2.7 |
| C+ | 2.3 | 2.3 |
| C | 2.0 | 2.0 |
| C- | 1.7 | 1.7 |
| D+ | 1.3 | 1.3 |
| D | 1.0 | 1.0 |
| F | 0.0 | 0.0 |

---

## 5. Indian Grading System

### 5.1 10-Point CGPA to US GPA

**Simple formula:** US GPA = Indian CGPA x 0.4

| Indian CGPA | Letter | US GPA |
|------------|--------|--------|
| 9.0-10.0 | O / A+ | 4.0 |
| 8.0-8.99 | A | 3.7 |
| 7.0-7.99 | B+ | 3.3 |
| 6.0-6.99 | B | 3.0 |
| 5.0-5.99 | C | 2.0 |
| 4.0-4.99 | D | 1.0 |
| Below 4.0 | F | 0.0 |

### 5.2 Indian Percentage System

| Percentage | Division | US GPA |
|-----------|---------|--------|
| 75-100% | First Class with Distinction | 3.7-4.0 |
| 60-74% | First Class | 3.0-3.7 |
| 50-59% | Second Class | 2.3-3.0 |
| 40-49% | Pass/Third Class | 1.0-2.0 |
| Below 40% | Fail | 0.0 |

### 5.3 WES-Specific Indian Conversion

WES uses a more detailed mapping for Indian grades:

| Indian Grade | CGPA Range | WES US GPA |
|-------------|-----------|-----------|
| O / A+ | 9.0-10.0 | 4.0 |
| A | 8.0-8.99 | 3.7 |
| B+ | 7.0-7.99 | 3.3 |
| B | 6.0-6.99 | 3.0 |
| C | 5.0-5.99 | 2.0 |
| D | 4.0-4.99 | 1.0 |
| F | Below 4.0 | 0.0 |

---

## 6. Hong Kong Grading System

### 6.1 University Level (4.0 Scale)

Most HK universities (HKU, CUHK, HKUST) use letter grades mapped to GPA:

| Letter Grade | Percentage | GPA (4.0) | GPA (4.3) |
|-------------|-----------|----------|----------|
| A+ | 90-100% | 4.0 | 4.3 |
| A | 85-89% | 4.0 | 4.0 |
| A- | 80-84% | 3.7 | 3.7 |
| B+ | 75-79% | 3.3 | 3.3 |
| B | 70-74% | 3.0 | 3.0 |
| B- | 65-69% | 2.7 | 2.7 |
| C+ | 60-64% | 2.3 | 2.3 |
| C | 55-59% | 2.0 | 2.0 |
| C- | 50-54% | 1.7 | 1.7 |
| D | 40-49% | 1.0 | 1.0 |
| F | Below 40% | 0.0 | 0.0 |

**Note:** Some HK universities cap A+ at 4.0 (making it a true 4.0 system), while others give A+ = 4.3. The tool should let users select which variant their university uses.

### 6.2 HKDSE (Secondary) to US GPA

| HKDSE Grade | US GPA |
|------------|--------|
| 5** | 4.0 |
| 5* | 4.0 |
| 5 | 3.0 |
| 4 | 2.0 |
| 3 | 1.0 |
| 2 | 0.0 |

---

## 7. European/German Grading System

### 7.1 German Scale (1.0-5.0, Inverted)

Germany uses a reversed scale where 1.0 is the best and 5.0 is fail.

| German Grade | Description | US GPA |
|-------------|------------|--------|
| 1.0 | Sehr gut (Very Good) | 4.0 |
| 1.3 | Sehr gut (-) | 3.9 |
| 1.7 | Gut (+) | 3.7 |
| 2.0 | Gut (Good) | 3.5 |
| 2.3 | Gut (-) | 3.3 |
| 2.7 | Befriedigend (+) | 3.0 |
| 3.0 | Befriedigend (Satisfactory) | 2.7 |
| 3.3 | Befriedigend (-) | 2.3 |
| 3.7 | Ausreichend (+) | 2.0 |
| 4.0 | Ausreichend (Sufficient) | 1.7 |
| 5.0 | Nicht bestanden (Fail) | 0.0 |

### 7.2 Modified Bavarian Formula

Used to convert between German and other scales:

```
German Grade = 1 + 3 * (Max_Grade - Your_Grade) / (Max_Grade - Min_Passing_Grade)
```

**Reverse (German to US 4.0):**
```
US GPA = 1 + 3 * (5.0 - German_Grade) / (5.0 - 1.0)
      = 1 + 3 * (5.0 - German_Grade) / 4.0
```

Or more precisely:
```
US GPA = 4.0 - (German_Grade - 1.0) * (3.0 / 3.0)
       = 5.0 - German_Grade
```

**Simplified:** US GPA ≈ 5.0 - German Grade (approximate, works for the middle range)

### 7.3 European ECTS Grades

| ECTS Grade | Description | US GPA |
|-----------|------------|--------|
| A | Excellent (top 10%) | 4.0 |
| B | Very Good (next 25%) | 3.5 |
| C | Good (next 30%) | 3.0 |
| D | Satisfactory (next 25%) | 2.0 |
| E | Sufficient (lowest 10% passing) | 1.0 |
| FX/F | Fail | 0.0 |

---

## 8. Japanese Grading System

### 8.1 Letter Grade Scale (S/A/B/C/F)

| Japanese Grade | Meaning | Percentage | US GPA |
|---------------|---------|-----------|--------|
| S (秀) | Excellent | 90-100% | 4.0 |
| A (優) | Very Good | 80-89% | 3.0 |
| B (良) | Good | 70-79% | 2.0 |
| C (可) | Acceptable | 60-69% | 1.0 |
| F (不可) | Fail | 0-59% | 0.0 |

**Note:** The above is the standard coarse conversion. A more nuanced mapping:

| Japanese Grade | US GPA (Fine) |
|---------------|--------------|
| S | 4.0 |
| A+ | 4.0 |
| A | 3.7 |
| B+ | 3.3 |
| B | 3.0 |
| B- | 2.7 |
| C+ | 2.3 |
| C | 2.0 |
| C- | 1.7 |
| F | 0.0 |

Some Japanese universities use a 4.0 GPA internally, and some use a 4.3 scale where S = 4.3.

---

## 9. Korean Grading System

South Korea uses three GPA scale variants depending on the university.

### 9.1 Korean 4.5 Scale (Most Common)

| Grade | Korean GPA (4.5) | US GPA (4.0) |
|-------|-----------------|-------------|
| A+ | 4.5 | 4.0 |
| A | 4.0 | 3.7 |
| B+ | 3.5 | 3.3 |
| B | 3.0 | 3.0 |
| C+ | 2.5 | 2.3 |
| C | 2.0 | 2.0 |
| D+ | 1.5 | 1.3 |
| D | 1.0 | 1.0 |
| F | 0.0 | 0.0 |

**Conversion formula:** US GPA = Korean GPA (4.5) * (4.0 / 4.5)

### 9.2 Korean 4.3 Scale

| Grade | Korean GPA (4.3) | US GPA (4.0) |
|-------|-----------------|-------------|
| A+ | 4.3 | 4.0 |
| A | 4.0 | 4.0 |
| A- | 3.7 | 3.7 |
| B+ | 3.3 | 3.3 |
| B | 3.0 | 3.0 |
| B- | 2.7 | 2.7 |
| C+ | 2.3 | 2.3 |
| C | 2.0 | 2.0 |
| C- | 1.7 | 1.7 |
| D+ | 1.3 | 1.3 |
| D | 1.0 | 1.0 |
| F | 0.0 | 0.0 |

### 9.3 Korean 4.0 Scale

Same as US 4.0 scale. Direct mapping, no conversion needed.

### 9.4 Percentage-Based

| Percentage | Letter | US GPA |
|-----------|--------|--------|
| 95-100% | A+ | 4.0 |
| 90-94% | A | 4.0 |
| 85-89% | B+ | 3.3 |
| 80-84% | B | 3.0 |
| 75-79% | C+ | 2.3 |
| 70-74% | C | 2.0 |
| 65-69% | D+ | 1.3 |
| 60-64% | D | 1.0 |
| Below 60% | F | 0.0 |

---

## 10. IB Diploma

### 10.1 IB Score to US GPA (Unweighted)

| IB Score | US GPA | Descriptor |
|---------|--------|-----------|
| 7 | 4.0 | Excellent |
| 6 | 3.7 | Very Good |
| 5 | 3.3 | Good |
| 4 | 2.3 | Satisfactory |
| 3 | 1.7 | Mediocre |
| 2 | 1.0 | Poor |
| 1 | 0.0 | Very Poor |

**Note:** There is no official IBO-sanctioned conversion. The IBO explicitly states that "due to the decentralized nature of the education system in the USA, there is no standard or externally moderated grading scale." Each university develops its own internal conversion policy.

### 10.2 IB Weighted GPA Consideration

Some US universities add a 0.5-1.0 bonus to IB Higher Level (HL) courses when calculating weighted GPA. Standard Level (SL) courses may or may not receive a bonus.

### 10.3 IB Total Score Context

For overall IB Diploma score (out of 45):
- 40+ = Highly competitive (equivalent to ~3.9-4.0)
- 35-39 = Strong (equivalent to ~3.5-3.8)
- 30-34 = Good (equivalent to ~3.0-3.5)
- 24-29 = Passing (equivalent to ~2.5-3.0)

---

## 11. A-Level

### 11.1 A-Level Grades to US GPA (Approximate)

There is NO official or universally accepted conversion. US universities evaluate A-Levels holistically. The following is an approximation used by some third-party services:

| A-Level Grade | UCAS Points | Approximate US GPA |
|--------------|------------|-------------------|
| A* | 56 | 4.0 |
| A | 48 | 4.0 |
| B | 40 | 3.3 |
| C | 32 | 2.7 |
| D | 24 | 2.0 |
| E | 16 | 1.3 |
| U (Ungraded) | 0 | 0.0 |

**Important:** The Fulbright Commission and EducationUSA advisers explicitly recommend against self-converting A-Level grades to GPA. US universities are experienced with A-Levels and evaluate them in context.

### 11.2 A-Level to UK Degree Correlation

For reference, typical A-Level offers from UK universities:
- AAA or above = Competitive for top universities
- ABB = Mid-range universities
- BBC = Less selective universities

---

## 12. WES Methodology & Rules

### 12.1 How WES Calculates iGPA

WES (World Education Services) uses a **credit-weighted** GPA calculation:

```
iGPA = Sum(Course_GPA * Course_Credits) / Sum(Course_Credits)
```

For each course:
1. Convert the grade to a US 4.0 equivalent using country-specific tables
2. Multiply by the course's credit hours
3. Sum all grade points
4. Divide by total credits

### 12.2 Key WES Rules

| Rule | Detail |
|------|--------|
| **Pass/Fail courses** | "Pass" is NOT included in GPA calculation. Only graded courses count. |
| **Failed courses** | Assigned 0.0 grade points; included in GPA calculation (lowers average) |
| **Retaken courses** | If a failed course is later passed, WES typically counts the passing grade, but the fail may still appear on the report |
| **All courses included** | WES does NOT drop lowest grades. All graded courses on the transcript are included |
| **Credit hours** | Must be on the transcript. If not, WES may estimate based on contact hours or program norms |
| **Thesis/Dissertation** | May or may not be included depending on whether it carries grade points |

### 12.3 Does WES Use Different Tables for Different Chinese Universities?

**Short answer: Not exactly.** WES uses a standardized conversion for China as a whole. They do NOT use the PKU algorithm or any university-specific algorithm. WES applies their own proprietary tables based on the country's grading norms.

However, WES does consider:
- The grading scale indicated on the transcript (percentage vs. letter vs. 5-point)
- Whether the institution uses a standard or non-standard scale
- The passing grade threshold at the institution

**Practical impact:** Students from universities with grade deflation (common at top Chinese universities) may find WES conversions feel low, because WES does not "curve" for institutional difficulty.

### 12.4 What WES Evaluates

- **Course-by-course evaluation:** Lists every course, its credits, and converted grade
- **Document-by-document evaluation:** Only confirms degree equivalency, no GPA
- The course-by-course version ($205 USD) is what produces the iGPA

---

## 13. WES vs ECE vs Other Services

### 13.1 Comparison Table

| Feature | WES | ECE | SpanTran | Josef Silny |
|---------|-----|-----|---------|-------------|
| **Acceptance** | Most widely accepted by US & Canadian schools | Widely accepted, strong in US | Accepted by many US schools | Niche, some specific schools |
| **Cost (Course-by-course)** | ~$205 | ~$185 | ~$195 | ~$200 |
| **Processing Time** | 7 business days | 5 business days | 5-7 business days | Varies |
| **Immigration** | Yes (IRCC Canada, USCIS) | No | Limited | Limited |
| **GPA Tendency** | Generally considered to produce slightly higher GPAs | Sometimes produces lower GPAs | Varies | Varies |
| **Methodology** | Proprietary, standardized by country | Proprietary, standardized by country | Similar | Similar |

### 13.2 Key Differences

- **WES** is the de facto standard for Canadian immigration (IRCC) and many US grad school applications
- **ECE** is cheaper and faster but not accepted for Canadian immigration
- GPA results CAN differ between services for the same transcript (typically within 0.1-0.3 range)
- Neither service publicly discloses exact conversion formulas
- Both use credit-weighted calculations
- WES tends to be slightly more generous than ECE for Chinese and Indian transcripts (anecdotal, not officially confirmed)

---

## 14. Target Scales Used by Universities

### 14.1 US 4.0 Scale (Standard)

| Grade | GPA |
|-------|-----|
| A | 4.0 |
| A- | 3.7 |
| B+ | 3.3 |
| B | 3.0 |
| B- | 2.7 |
| C+ | 2.3 |
| C | 2.0 |
| C- | 1.7 |
| D+ | 1.3 |
| D | 1.0 |
| D- | 0.7 |
| F | 0.0 |

### 14.2 US 4.0 Scale (Without Plus/Minus)

| Grade | GPA |
|-------|-----|
| A | 4.0 |
| B | 3.0 |
| C | 2.0 |
| D | 1.0 |
| F | 0.0 |

### 14.3 UK Degree Classifications

| Classification | Percentage | Meaning |
|---------------|-----------|---------|
| First Class (1st) | 70%+ | Excellent |
| Upper Second (2:1) | 60-69% | Very Good |
| Lower Second (2:2) | 50-59% | Good |
| Third Class (3rd) | 40-49% | Satisfactory |
| Pass | 35-39% | Minimum |
| Fail | Below 35% | Fail |

### 14.4 Australian GPA (7-Point)

| GPA | Classification |
|-----|---------------|
| 6.5-7.0 | High Distinction |
| 5.5-6.49 | Distinction |
| 4.5-5.49 | Credit |
| 3.5-4.49 | Pass |
| Below 3.5 | Fail |

### 14.5 Canadian GPA Variants

- **4.0 scale:** Standard at most universities
- **4.3 scale:** Used by some universities (McGill, UBC, etc.) where A+ = 4.3
- **9.0 scale:** Used by some universities (e.g., York University, U of Alberta uses letter-to-9pt)
- **12.0 scale:** Used by some institutions (rare)

---

## 15. Weighted vs Unweighted GPA

### 15.1 Credit-Weighted GPA (Standard Method)

Used by WES and most universities:

```
Weighted GPA = Sum(Grade_Points_i * Credits_i) / Sum(Credits_i)
```

**Example:**
| Course | Grade | GPA | Credits | Quality Points |
|--------|-------|-----|---------|---------------|
| Math | 95 | 4.0 | 4 | 16.0 |
| English | 82 | 3.3 | 3 | 9.9 |
| History | 78 | 3.0 | 3 | 9.0 |
| **Total** | | | **10** | **34.9** |

**Weighted GPA = 34.9 / 10 = 3.49**

### 15.2 Unweighted (Simple Average)

Simple average of all GPAs without considering credits:

```
Unweighted GPA = Sum(Grade_Points_i) / Number_of_Courses
```

Using the same example: (4.0 + 3.3 + 3.0) / 3 = 3.43

### 15.3 When to Use Which

- **WES and all official evaluations:** Always credit-weighted
- **Self-reported GPA:** Usually credit-weighted, but some students use unweighted (less common)
- **US university calculations:** Always credit-weighted
- **The calculator should default to credit-weighted** with an option for unweighted

---

## 16. Implementation Notes for Calculator

### 16.1 Recommended Input Systems

The calculator should support these input modes:

1. **Chinese Percentage (百分制)** - Most common for Chinese students
   - Let user select algorithm: Standard, PKU, Modified 1, Modified 2, WES, USTC 4.3, SJTU 4.3, Canadian 4.3
2. **Chinese Letter Grade (等级制)** - For PKU/Tsinghua etc.
3. **UK Percentage** - Convert to classification & US GPA
4. **Australian Grade (HD/D/C/P/F)** - Direct mapping
5. **Australian 7-point** - Formula conversion
6. **Canadian Provincial** - Ontario, Alberta, BC variants
7. **Indian CGPA (10-point)** - Formula: x 0.4
8. **Indian Percentage** - Division-based mapping
9. **Hong Kong Letter Grade** - 4.0 or 4.3 variant
10. **German Scale (1.0-5.0)** - Inverted mapping
11. **ECTS Grades** - A-F mapping
12. **Japanese (S/A/B/C/F)** - Direct mapping
13. **Korean (4.0 / 4.3 / 4.5)** - Scale-specific conversion
14. **IB (1-7)** - Per-subject conversion
15. **A-Level (A*-E)** - Approximate conversion with disclaimer

### 16.2 Recommended Output Targets

For each input, the calculator should output:

- **US 4.0 GPA** (primary)
- **WES iGPA estimate** (for applicants needing WES)
- **UK classification equivalent** (for UK applicants)
- **Australian 7-point equivalent** (optional)
- **Percentile context** (e.g., "A 3.5 GPA is competitive for most US graduate programs")

### 16.3 Key UX Considerations

- Allow adding multiple courses with individual grades and credits
- Show both weighted and unweighted results
- Clearly label which algorithm is being used
- Add disclaimers that these are estimates; official WES evaluation required for applications
- For Chinese students: default to PKU algorithm (most commonly used in study-abroad context) but let users switch
- Show a comparison table of results across algorithms for the same input

### 16.4 Data Structure for Course Entry

```json
{
  "system": "chinese_percentage",
  "algorithm": "pku",
  "courses": [
    {
      "name": "高等数学",
      "score": 92,
      "credits": 4
    },
    {
      "name": "大学英语",
      "score": 85,
      "credits": 3
    }
  ]
}
```

### 16.5 Recommended Default Algorithms per System

| Input System | Default Algorithm | Reason |
|-------------|------------------|--------|
| Chinese Percentage | PKU 4.0 | Most popular among applicants |
| Chinese Letter | Standard A-F | Direct mapping |
| UK | Classification-based | Standard for UK |
| Australian | HD/D/C/P/F | Most common |
| Canadian | Ontario | Largest province |
| Indian | CGPA x 0.4 | Widely used |
| Hong Kong | 4.0 scale | More common than 4.3 |
| German | Direct mapping table | Standard |
| Japanese | S/A/B/C/F coarse | Standard |
| Korean | 4.5 scale | Most common in Korea |
| IB | Unweighted | No official weighted |
| A-Level | Approximate | With disclaimer |

---

## Sources

- [WES iGPA Calculator](https://applications.wes.org/igpa-calculator/)
- [WES Country Resources](https://applications.wes.org/country-resources/)
- [WES Credential Evaluations](https://www.wes.org/credential-evaluations/)
- [GPA Calculator - International Grade Conversion](https://gpacalculator.net/grade-conversion/)
- [SmartCGPA - Converting International Grades to US GPA 2026](https://smartcgpa.com/blog/converting-international-grades-us-gpa-2026)
- [ChaseDream GPA Calculator](https://apps.chasedream.com/gpa/)
- [China GPA Conversion Guide](https://thegpacalculator.com/blog/china-100-point-gpa-to-4-0-scale-conversion-guide)
- [OpenEduCat - China University Grading System](https://openeducat.org/articles/china-university-grading-system-gpa-conversion/)
- [Galvanize Test Prep - WES GPA Calculator](https://galvanizetestprep.com/wes-gpa-calculator/)
- [CalcArena - WES iGPA Calculator](https://calcarena.com/calculators/education-academics/wes-igpa-calculator.html)
- [Crimson Education - IB to GPA](https://www.crimsoneducation.org/us/blog/ib-to-gpa)
- [Wikipedia - Academic Grading in China](https://en.wikipedia.org/wiki/Academic_grading_in_China)
- [Wikipedia - Academic Grading in South Korea](https://en.wikipedia.org/wiki/Academic_grading_in_South_Korea)
- [Wikipedia - Academic Grading in Japan](https://en.wikipedia.org/wiki/Academic_grading_in_Japan)
- [Scholaro - International Grading Systems](https://www.scholaro.com/db/Countries/)
- [知乎 - GPA算法大全](https://zhuanlan.zhihu.com/p/383617897)
- [寄托论坛 - 北大算法/浙大算法/WES算法比较](https://bbs.gter.net/thread-1300581-1-1.html)
- [Oreate AI - Transcript Certification Systems Comparison](https://www.oreateai.com/blog/detailed-explanation-of-transcript-certification-systems-in-us-college-applications)
- [Maven Consulting - WES vs ECE vs ACEI](https://www.mavenconsultingservices.com/article/credential-evaluation-for-international-students-wes-ece-acei/)
