# Community

Slang is fully open-source and all developments for Slang take place within the public [GitHub repo](https://github.com/shader-slang/slang).
If you'd like to contribute to the project, we are excited to have your input.
Please review the following materials to learn more abount our community structure and our process of managing changes.

## Community Discussions

We use the [GitHub discussion page](https://github.com/shader-slang/slang/discussions) for all community announcements and discussions. All community members are welcomed to post questions, ideas, suggestions for new features in the discussion page. We will also use the discussion page to announce or provide update on new feature developments.

## Community Structure

We distinguish in our community between “community”, “committer” and OWNERs in our system inspired by eg. [Chromium](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/code_reviews.md#expectations-of-owners).

#### Community Member

The term community refers to everyone using Slang or participating in the Slang open source project in any form. All community members are welcomed to
report issues, start discussion threads, or submit pull requests.

#### Committer

A committer is a community member who can review and approve pull requests. This is a status that can be earned by maintaining a track record of submiting and landing code changes to the Slang project. All community members can review code submitted by other community members, but for a pull request to be considered approved and ready for merging, at least one **owner** (more info below) of each file you are touching must provide an approving review. Ideally a committer should choose reviewers who are familiar with the area of code you are touching. If you have doubts, look at the git blame for the file and the OWNERS files.

Submissions to a repository by a change contributor who is not a Slang committer require two committers to approve the submission. If the author of the pull request is already a committer, then only one other committer is needed to review.

If you think you might be ready to be a committer, ask one of the reviewers of your pull request or another committer familiar with your work to see if they will nominate you. They will discuss that in #slang-committers discord — two others in that will need to second the nomination. We will create a policy similar to the terms in https://www.chromium.org/getting-involved/become-a-committer/ for this.

#### Owner

Every file in the Slang repository has a list of owners. An owner of a directory has right to approve pull requests touching the directory. A pull request is considered approved only when at least two owners for each directory changed by the pull request have approved the pull request. If you are a committer and think you’re ready to become an owner of a directory, put up a PR to the relevant OWNERs and get two owners to review it. In face of conflict between owner, owner need to reach consensus amongst themselves.

#### Language Owner

A language owner is the owner of the [`/docs/proposals/`](https://github.com/shader-slang/slang/tree/master/docs/proposals) directory. All new Slang language and core module features (e.g. new language syntax or new function or type in the Slang core module) starts with a design document submitted to this directory. The language and core module design must be approved by two language owners before any implementation pull request for the new language feature can be approved.

## Processes for Code Changes

#### Process for Bug Fixes
A bug fix starts with an GitHub issue describing the bug. Any community member can submit a pull request coming from your personal fork of Slang containing fixes for the bug. Such pull requests needs to be reviewed and approved by two committers who are owners of the files being changed by the pull request. Once the pull request is approved and passed all CI tests, it can be merged to the main branch. All pull requests are expected to meet
our bar of code quality.

#### Process for Language Changes

Changes that add or modify syntax, language feature, Slang's core module, or the compilation and reflection API must go through our process for language changes. The full process is [documented here](/community/language-change-process.md).

## Submitting a Pull Request

If you are ready to start contributing, please follow our [guide for creating a pull request](https://github.com/shader-slang/slang/CONTRIBUTION.md).
