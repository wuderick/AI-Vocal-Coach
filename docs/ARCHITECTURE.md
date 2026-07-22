# AI Vocal Coach Architecture

## 1. Vision

AI Vocal Coach is a real-time singing practice and feedback platform designed to help users build pitch accuracy, musical consistency, and healthy vocal habits through immediate analysis and guided coaching.

Long-term goals:
- Deliver low-latency, real-time pitch and singing feedback during live practice.
- Provide reliable note-level and phrase-level performance insights over time.
- Convert raw audio into actionable coaching recommendations.
- Support progressive learning experiences, from beginner pitch matching to advanced expressive control.
- Establish a modular architecture where analysis algorithms can evolve without destabilizing the product.

## 2. Overall Architecture

The system uses a layered architecture to isolate concerns, improve testability, and support iterative feature growth.

### Presentation Layer
- Renders UI for practice, settings, diagnostics, and coaching feedback.
- Displays pitch, notes, analytics, and session outcomes.
- Captures user interactions and routes them into application actions.

### Application Layer
- Coordinates feature workflows and user-intent driven actions.
- Owns orchestration logic between UI and domain services.
- Maintains predictable interaction boundaries and state transitions.

### Analysis Layer
- Aggregates and interprets processed pitch/note data into musical meaning.
- Computes higher-level metrics such as stability, drift, onset quality, and phrase performance.
- Prepares model-ready signals for the Practice Engine and AI Coach.

### Processing Layer
- Transforms raw pitch streams into stable musical signals.
- Handles pitch history buffering, smoothing, and segmentation pipelines.
- Produces normalized intermediate structures consumed by analysis.

### Detection Layer
- Detects fundamental frequency and confidence from time-domain audio.
- Applies voiced/unvoiced validation and thresholding.
- Maps valid frequencies into musical note-space primitives.

### Audio Runtime Layer
- Owns microphone acquisition, stream lifecycle, and Web Audio graph setup.
- Reads analyser buffers and manages frame update scheduling.
- Provides reliable runtime audio data to upper layers.

## 3. Data Flow

Complete processing pipeline:

Microphone
↓
Audio Capture
↓
Audio Graph
↓
Pitch Detection
↓
Pitch History Buffer
↓
Pitch Smoothing
↓
Note Segmentation
↓
Musical Note Mapping
↓
Pitch Analytics
↓
Practice Engine
↓
AI Coach

Pipeline intent:
- Audio Runtime Layer acquires and frames audio data.
- Detection Layer extracts frequency and confidence.
- Processing Layer stabilizes temporal pitch behavior and segments notes.
- Analysis Layer turns note/pitch sequences into meaningful performance insights.
- Application and Presentation layers deliver feedback loops to the user.

## 4. Folder Structure

components/
- UI and feature-level visual building blocks.
- Keeps rendering concerns separate from business logic.

hooks/
- Reusable stateful behaviors and view-model composition.
- Bridges state and services for component consumption.

services/
- Pure or runtime services for audio capture, DSP, detection, and mapping.
- Encapsulates domain behavior behind stable interfaces.

state/
- Centralized application and runtime state management.
- Defines actions, transitions, and shared data contracts.

pages/
- Route-level composition and screen assembly.
- Connects feature components into navigable experiences.

tasks/
- Implementation tracking artifacts for scoped development tasks.
- Documents acceptance criteria and execution checkpoints.

docs/
- Long-term architecture, product, and engineering references.
- Captures decisions, rationale, and roadmap context.

## 5. Current Milestone

Milestone 1: Audio Foundation is completed.

Completed tasks:
- TASK_017
- TASK_018
- TASK_019A
- TASK_019B
- TASK_020
- TASK_021

Milestone 1 outcome:
- Stable microphone runtime lifecycle.
- Time-domain and frequency-domain data pathways.
- Foundational pitch detection and pitch mapping services.
- Developer diagnostics panel and integration baseline.

## 6. Future Milestones

### Milestone 2: Pitch Processing
- Introduce pitch history buffering and temporal smoothing.
- Add note segmentation and onset/offset detection.
- Improve continuity handling between voiced and unvoiced regions.

### Milestone 3: Singing Analysis
- Compute note accuracy, sustain quality, stability, and phrasing metrics.
- Generate session-level summaries and progress indicators.
- Build analysis primitives for structured practice feedback.

### Milestone 4: AI Vocal Coach
- Create adaptive coaching responses based on analytical outputs.
- Add personalized exercises, goals, and correction strategies.
- Support contextual feedback for warmups, drills, and songs.

## 7. Design Principles

Single Responsibility
- Each module should own one clear concern and one reason to change.

Single Source of Truth
- Shared runtime and app state must be centralized to avoid divergence.

Foundation First
- Build robust low-level audio and detection layers before advanced coaching features.

Minimal Diff
- Prefer focused, scoped changes that reduce regression risk and review complexity.

Testable by Design
- Keep services composable and deterministic where possible for reliable automated tests.

Immutable Data Flow
- Pass derived analysis data upward as immutable values to prevent hidden side effects.

## 8. Future Extension

The architecture is intentionally algorithm-agnostic at the Detection Layer boundary. Future DSP models and detectors, including YIN, CREPE, and successor approaches, can replace or augment the current pitch detection implementation without requiring changes to upper layers.

By keeping the contract stable between Detection, Processing, and Analysis layers, the system can evolve detection quality independently while preserving UI behavior, application workflows, and coaching logic.
