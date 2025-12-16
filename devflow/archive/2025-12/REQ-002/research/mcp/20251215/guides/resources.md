# Shift-Left Testing Resources Index

**Generated**: 2025-12-15
**Topic**: Requirements Quality Checklist Framework

---

## Official Resources

### BMC - Shift Left Testing Explained
- **URL**: https://www.bmc.com/blogs/what-is-shift-left-shift-left-testing-explained/
- **Key Insights**:
  - Shift-left testing moves testing earlier in the lifecycle
  - Coined by Larry Smith in 2001
  - Core principle: "test early and often"

### CMU SEI - Four Types of Shift Left Testing
- **URL**: https://www.sei.cmu.edu/blog/four-types-of-shift-left-testing/
- **Key Insights**:
  - Four distinct approaches to shift-left
  - Strategic enablers of quality

### BrowserStack - Shift Left Testing Guide
- **URL**: https://www.browserstack.com/guide/what-is-shift-left-testing
- **Key Insights**:
  - Implementation best practices
  - Quality gates before development

---

## Best Practices (2025)

### Quality Trends
- Testing Centers of Excellence (TCoE) projected 35% growth in 2025
- Shift from test execution to quality enablement
- Emphasis on QA involvement in requirements analysis

### Implementation Patterns
1. **Checklist-Based Verification**
   - Use appropriate checklists to verify and validate requirements
   - Reduces ambiguity and prevents downstream defects

2. **Quality Gates**
   - Define clear pass/fail criteria
   - Minimum threshold approach (80% recommended)

3. **Automation Integration**
   - Invest in test automation frameworks early
   - Support rapid feedback and continuous integration

---

## Unit Testing for Requirements

### AAA Pattern (Arrange-Act-Assert)
- Organize and prepare the code
- Conduct the test step
- Assess test results against expected outcomes

### Naming Convention (Microsoft Standard)
Format: `[MethodUnderTest]_[Scenario]_[ExpectedBehavior]`
Example: `ProcessPayment_InsufficientFunds_ThrowsPaymentException`

### Key Principle
> Unit tests function as a form of documentation. They demonstrate how the code is intended to be used, serving as executable specifications that document functionality.

**Applied to Requirements**: Checklists serve as executable specifications for requirement quality.

---

## Reference Links

- [BMC Shift-Left Testing](https://www.bmc.com/blogs/what-is-shift-left-shift-left-testing-explained/)
- [CMU SEI Four Types](https://www.sei.cmu.edu/blog/four-types-of-shift-left-testing/)
- [BrowserStack Guide](https://www.browserstack.com/guide/what-is-shift-left-testing)
- [Microsoft Unit Testing Best Practices](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)
- [GeeksforGeeks Unit Testing 2025](https://www.geeksforgeeks.org/unit-testing-best-practices/)
- [IBM Unit Testing Best Practices](https://www.ibm.com/think/insights/unit-testing-best-practices)
