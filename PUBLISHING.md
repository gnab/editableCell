## Publishing a release

1. Decide upon the [next version](http://www.semver.org) of your release.

> NOTE: We don't store the version in `bower.json` (since they pull from the latest published tag), but we **do** put it in `package.json`

2. Edit the `package.json` file, and update the version based on your decision in 1, but do **not** commit it.

3. Follow the steps below to publish a release to GitHub.

> NOTE: This works for either the `master` or `develop` branches. In general,
we try to release stable from `master`, but of course you could maintain a
separate major or minor release from the `develop` branch.

```
git add package.json
git add -f out/*
git checkout head
git commit -m "Version {version} for distribution"
git tag -a v{version} -m "Add tag v{verson}"
git checkout master
git push origin --tags
```

> NOTE: You may wish to exclude the tests.js file from the above; in that case,
substitute the following for line 2:

```
git add -f out/editableCell.*
```
