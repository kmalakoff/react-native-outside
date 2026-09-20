# Current native fixture

This locked project runs React Native 0.87.1 with React 19.2.3 and Fabric.
The native workflow copies it to scratch space, installs the four candidate
tarballs, bundles Metro, and runs the shared Maestro flow on Android and iOS.

The project uses react-native-test-app 5.4.9. That dependency belongs only to
this current endpoint. The minimum endpoint is a separate RN 0.59.10 Paper
project.
