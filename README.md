# Interactive Optimization Demo

Three interactive demos illustrating optimization concepts on the [Ackley function](https://en.wikipedia.org/wiki/Ackley_function).

**Live:** [cherrywoods.github.io/sgd-demo](https://cherrywoods.github.io/sgd-demo/)

## How to use

Click anywhere on the canvas to evaluate the function at that point. The view automatically pans to center on your selection. The overlay on the right shows the current function value and the best (lowest) value found so far.

The three modes are:

- **0th Order** — You only see function values. Search blind.
- **1st Order** — A compass shows the steepest descent direction (−∇f). Use it to guide your search toward the minimum.
- **Stochastic GD** — The compass shows a noisy gradient estimate, simulating the uncertainty in real stochastic gradient descent.

Use the **↩ Undo** button (top-left) to step back.

## Configuration

In `shared.js`, change `ACTIVE_FN` to switch between the Ackley and Eggholder test functions. Each function profile controls the domain, zoom level, compass scaling, noise magnitude, and start position.
