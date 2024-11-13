# Bar of Code Quality for Slang
Thank you for your interest in contributing to Slang! We welcome contributions from the community, and to ensure a high standard of quality across the codebase, we maintain a set of expectations that we ask all contributors to adhere to. Please read through the following guidelines to help your pull request meet the quality bar required for merging.

## Code Style and Consistency

**Follow Project Standards:** Adhere to the code style and conventions currently used in Slang. This includes formatting, naming conventions, and structural patterns.

**Consistent Formatting:** Use spaces/tabs, line lengths, and other formatting elements as defined by the existing code. All code must be formatted with `clang-format` using the configuration in the root source directory.

**Comments and Documentation:** Document all public methods, significant logic blocks, and any complex code in a clear, concise manner. Each comment should add value to the code and explain why something is done, not just what it does.

## Code Efficiency and Performance

Many graphics applications are having issues with long shader compilation times. We should make sure the Slang compiler runs efficiently whenever possible to not make shader compilation time worse for our user applications. Aim for efficiency in your code, avoiding unnecessary computations, memory allocations, and redundant processes. Memory Management: Ensure that memory is allocated, used, and deallocated properly, with attention to avoiding memory leaks. Use C++ RAII mechanism whenever possible to ensure correctness of resource management.

## Testing

**Unit and Integration Tests:** Include tests for all new features and bug fixes. Each pull request should add or update tests that validate the new functionality or fix. Pull requests should not break any existing tests.

**Reproducibility:** Ensure that any reported bug fixes or features work consistently across different environments supported by Slang.

**Maintain Test Coverage:** Maintain or improve existing test coverage. Avoid reducing the coverage or introducing untested paths in the code.

## Code Readability

**Readable and Self-Explanatory:** Code should be easy to read and self-explanatory, even without comments. Avoid overly complex or nested structures; prioritize clarity over conciseness.

**Function and Variable Naming:** Use descriptive names for variables, functions, and classes. Names should make the code’s purpose immediately clear.

**Comments:** Use comments to document the purpose of new types and functions you introduce. For functions that implement complex logic, comments should focus on why the logic is needed, and not just a rephrase of what the code is doing.

**Small, Focused Commits:** Keep each commit focused on a single change or issue. This helps reviewers understand the intent of the change and makes it easier to trace history later.

## Code Review Process

**Follow Review Feedback:** Be prepared to make changes based on feedback from committers. We aim for constructive reviews that ensure quality without stalling progress.

**Documentation and Clarity:** Provide a clear and detailed pull request description. Include context, goals, and any specific details reviewers should know to understand your contribution.

## Community and Collaboration
Be Respectful and Collaborative: Open-source projects are collaborative efforts. Communicate clearly, and respect feedback and the time of maintainers and reviewers.

Thank you for contributing to our project and helping to build a robust shading language for the community!