# HealthMate Feature Descriptions

This document is a draft use-case specification prepared from the current implementation in the HealthMate codebase.

Author: Project Team  
Version: 1.0  
Date: 22/03/2026

---

## USE CASE-01

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC01 | Use-case Version | 1.0 |
| Use-case Name | Register | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Guest |  |  |
| Summary | Guest creates a new HealthMate account. |  |  |
| Goal | Allow a new user to access personalized health features. |  |  |
| Triggers | Guest clicks `Register` on the landing page or login page. |  |  |
| Preconditions | Guest is not logged in and uses an email not yet registered. |  |  |
| Post Conditions | New account is created, token is issued, and user is redirected to onboarding. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Guest opens the register page. | System displays the registration form. |
| 2 | Guest enters full name, email, password, and confirm password. | System validates required fields and password confirmation. |
| 3 | Guest submits the form. | System creates a new user account and issues a JWT token. |
| 4 | Guest registration succeeds. | System stores login state and redirects user to onboarding. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Email already exists. | System shows registration failure message. |
| 2b | Password confirmation does not match. | System blocks submission and asks user to re-enter password. |
| 3a | Server or network error occurs. | System shows error message and keeps user on register page. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Required registration fields are missing or password confirmation is invalid. |
| 400 | Email Already Exists | The submitted email has already been used by another account. |
| 500 | Internal Server Error | The server fails while creating the user account or issuing the token. |
### Business Rules

| Code | Rule |
|---|---|
| BR-01 | Email, password, and full name are mandatory. |
| BR-02 | Duplicate email addresses are not allowed. |

---

## USE CASE-02

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC02 | Use-case Version | 1.0 |
| Use-case Name | Login | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Guest, User, Admin |  |  |
| Summary | User logs into the system with email and password. |  |  |
| Goal | Allow authenticated access based on role and profile completion. |  |  |
| Triggers | Guest clicks `Login`. |  |  |
| Preconditions | User account exists and is not banned. |  |  |
| Post Conditions | User session is created and user is redirected to the correct page. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Guest opens the login page. | System displays email and password form. |
| 2 | Guest enters valid credentials. | System validates the input. |
| 3 | Guest submits the form. | System authenticates the account and returns token plus user info. |
| 4 | User is authenticated. | System stores session in local storage. |
| 5 | System checks role and profile state. | Admin is redirected to admin dashboard, completed user to homepage, incomplete user to onboarding. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Email or password is empty. | System displays validation message. |
| 3a | Credentials are invalid. | System displays login failure message. |
| 3b | Account status is banned. | System denies access with forbidden message. |
| 3c | Server or network error occurs. | System displays connection error message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Email or password is not provided in the login form. |
| 401 | Unauthorized | Email or password is incorrect. |
| 403 | Forbidden | The account has been banned and cannot access the system. |
| 500 | Internal Server Error | The server fails during authentication or token generation. |
### Business Rules

| Code | Rule |
|---|---|
| BR-03 | JWT token is used for authenticated requests. |
| BR-04 | Role-based redirect is enforced after login. |

---

## USE CASE-03

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC03 | Use-case Version | 1.0 |
| Use-case Name | Logout | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User, Admin |  |  |
| Summary | Logged-in user logs out of the system. |  |  |
| Goal | End the current session and return user to public state. |  |  |
| Triggers | User clicks `Logout`. |  |  |
| Preconditions | User is already logged in. |  |  |
| Post Conditions | Local session data is removed and protected routes become inaccessible. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User clicks the logout button. | System clears token and user data from local storage. |
| 2 | Logout completes. | System redirects user to login page or public page. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | Token is already expired or missing. | System still clears local state and redirects safely. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| N/A | No Server Exception | Logout is handled locally by clearing session data in the browser. |
| 401 | Unauthorized | Expired or malformed token is detected before or during protected navigation. |
### Business Rules

| Code | Rule |
|---|---|
| BR-05 | Logout is handled client-side by removing stored authentication data. |

---

## USE CASE-04

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC04 | Use-case Version | 1.0 |
| Use-case Name | Google Login | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Guest |  |  |
| Summary | Guest signs in using Google account. |  |  |
| Goal | Provide faster authentication and create account automatically if needed. |  |  |
| Triggers | Guest clicks `Google` on login page. |  |  |
| Preconditions | Guest has a valid Google account and authorizes access. |  |  |
| Post Conditions | User is authenticated and redirected according to role or onboarding status. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Guest clicks Google login. | System opens Google authentication flow. |
| 2 | Guest grants permission. | System receives Google user information. |
| 3 | Frontend sends Google profile data to backend. | System finds or creates a matching HealthMate account. |
| 4 | Authentication succeeds. | System issues JWT token and stores session. |
| 5 | Login state is resolved. | System redirects user to admin dashboard, homepage, or onboarding. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | Guest closes Google popup. | System shows Google login error. |
| 3a | Google email is missing. | System rejects the request. |
| 3b | Existing account is banned. | System denies access. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Google account data does not contain a usable email. |
| 403 | Forbidden | Existing account is banned and cannot continue with Google login. |
| 500 | Internal Server Error | Server fails while creating or authenticating the Google-based account. |
| Client Error | Google Popup Closed | User closes the Google login popup or denies consent. |
### Business Rules

| Code | Rule |
|---|---|
| BR-06 | If account does not exist, the system creates one automatically. |
| BR-07 | Existing banned accounts cannot use Google login. |

---

## USE CASE-05

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC05 | Use-case Version | 1.0 |
| Use-case Name | Complete Onboarding and Update Profile | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User enters or updates personal data such as body metrics and fitness goal. |  |  |
| Goal | Build a profile used for personalized meals, workouts, and AI insights. |  |  |
| Triggers | User enters onboarding page or profile page. |  |  |
| Preconditions | User is authenticated. |  |  |
| Post Conditions | User profile is saved and can be used by other modules. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens onboarding or profile page. | System loads current profile information. |
| 2 | User enters gender, height, weight, and fitness goal. | System validates submitted profile fields. |
| 3 | User saves profile. | System updates the user record in database. |
| 4 | Profile update succeeds. | System shows updated information for future personalization. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | Token is invalid or expired. | System redirects user to login page. |
| 3a | Profile payload is missing. | System returns validation error. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Profile payload is missing when updating personal information. |
| 401 | Unauthorized | User token is missing, expired, or invalid. |
| 404 | Not Found | User account cannot be found for profile retrieval or update. |
| 500 | Internal Server Error | Server fails while saving or fetching profile data. |
### Business Rules

| Code | Rule |
|---|---|
| BR-08 | Profile can be updated partially; existing data is merged with new data. |
| BR-09 | Height and weight are required for full personalization flow. |

---

## USE CASE-06

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC06 | Use-case Version | 1.0 |
| Use-case Name | View Personal Overview and Health Metrics | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User views personal profile summary, BMI, and derived health indicators. |  |  |
| Goal | Help user understand current physical condition and progress. |  |  |
| Triggers | User opens overview, profile, or AI analytics page. |  |  |
| Preconditions | User is authenticated and profile data exists. |  |  |
| Post Conditions | Current profile metrics and health indicators are displayed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens health-related dashboard. | System loads profile and metric data. |
| 2 | System calculates BMI, metabolic rate, recovery score, and workout chart data. | System formats and displays analytics widgets. |
| 3 | User reviews information. | System keeps data available for decision making and AI support. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | User has incomplete body metrics. | System displays partial analytics or placeholders. |
| 2a | Metrics API fails. | System keeps page available and logs the error. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Health metrics cannot be viewed without a valid authenticated session. |
| 404 | Not Found | User profile or supporting records cannot be found. |
| 500 | Internal Server Error | System fails while calculating or loading health indicators. |
| Data Warning | Incomplete Metrics | Height, weight, or workout data is missing, so some indicators are partial or blank. |
### Business Rules

| Code | Rule |
|---|---|
| BR-10 | BMI is derived from height and weight. |
| BR-11 | Health metrics are computed dynamically from profile and workout logs. |

---

## USE CASE-07

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC07 | Use-case Version | 1.0 |
| Use-case Name | Manage Fitness Goal and Generate AI Roadmap | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User defines a fitness goal and asks AI to generate a personalized roadmap. |  |  |
| Goal | Convert broad fitness intent into phases and weekly micro goals. |  |  |
| Triggers | User clicks `Generate Roadmap with AI` on Fitness Goals page. |  |  |
| Preconditions | User is authenticated and provides goal setup data. |  |  |
| Post Conditions | Active goal is stored, previous active goals are archived, and micro goals are created. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens Fitness Goals page. | System loads current active goal and micro goals if they exist. |
| 2 | User enters title, goal type, duration, workout commitment, target metrics, and motivation. | System validates input values. |
| 3 | User clicks AI generation. | System sends goal and profile context to Gemini AI. |
| 4 | AI returns phases and weekly micro goals. | System archives old active goals and saves the new roadmap. |
| 5 | Goal creation succeeds. | System displays roadmap, progress panels, and weekly tasks. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Duration is missing or invalid. | System rejects the request with validation error. |
| 3a | User already has an active goal. | System asks confirmation before replacing the current journey. |
| 4a | AI response is invalid or server fails. | System shows AI generation failure message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Duration weeks is missing or less than the valid minimum. |
| 401 | Unauthorized | Goal generation is requested without a valid token. |
| 404 | Not Found | Current authenticated user cannot be found in the database. |
| 500 | AI Generation Failed | Gemini output is invalid, cannot be parsed, or roadmap persistence fails. |
| Client Warning | Goal Replacement Confirmation | User cancels replacement of an existing active goal. |
### Business Rules

| Code | Rule |
|---|---|
| BR-12 | The roadmap is generated in 3 phases. |
| BR-13 | The current implementation expects 3 micro goals per week from AI output. |
| BR-14 | Only one active goal is kept; previous active goals are archived. |

---

## USE CASE-08

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC08 | Use-case Version | 1.0 |
| Use-case Name | Weekly Goal Check-in and Micro Goal Tracking | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User marks micro goals done and logs weekly body progress. |  |  |
| Goal | Track completion status and weight change across the goal journey. |  |  |
| Triggers | User checks a task or clicks `Log Weekly Progress`. |  |  |
| Preconditions | User has an active goal and generated micro goals. |  |  |
| Post Conditions | Task status and weekly log are updated; overall progress and charts are recalculated. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens a specific week. | System shows weekly micro goals and check-in status. |
| 2 | User marks a micro goal as done. | System updates task status in database and UI. |
| 3 | User opens weekly check-in modal. | System preloads previous week data if it exists. |
| 4 | User submits current weight and feeling. | System saves or updates the weekly log. |
| 5 | Check-in completes. | System refreshes roadmap progress and weight tracking chart. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Task update fails. | System rolls back checkbox state and shows error. |
| 4a | Weight is empty. | System prevents submission and requests weight value. |
| 4b | Goal cannot be found. | System returns not found message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Week or weight is missing from the weekly check-in submission. |
| 401 | Unauthorized | User is not logged in when updating a micro goal or weekly log. |
| 404 | Not Found | Goal or micro goal cannot be found for the requested update. |
| 500 | Internal Server Error | Server fails while saving task status or weekly check-in data. |
| Client Rollback | UI Update Reverted | Checkbox state is reverted when the status update request fails. |
### Business Rules

| Code | Rule |
|---|---|
| BR-15 | Weekly check-in requires at least week number and weight. |
| BR-16 | Check-in for the same week updates existing data instead of creating duplicates. |

---

## USE CASE-09

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC09 | Use-case Version | 1.0 |
| Use-case Name | Browse Food Catalog | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | Guest, User |  |  |
| Summary | User views available foods and nutrition information. |  |  |
| Goal | Help users discover food items to build meal plans. |  |  |
| Triggers | User opens food catalog page. |  |  |
| Preconditions | Food records exist in the system. |  |  |
| Post Conditions | Food list and selected food details are available for browsing or meal planning. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens food catalog. | System requests all food items from backend. |
| 2 | User browses the list or selects a food item. | System displays nutrition details and related metadata. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | Food API fails. | System shows empty or error state. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 404 | Not Found | Requested food item cannot be found by its identifier. |
| 500 | Internal Server Error | Server fails while loading food catalog data. |
| Data Warning | Empty Catalog | No food records are available to display. |
### Business Rules

| Code | Rule |
|---|---|
| BR-17 | Food catalog read access is public in current implementation. |

---

## USE CASE-10

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC10 | Use-case Version | 1.0 |
| Use-case Name | Manage Daily Meal Plan | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User creates and manages a meal plan for a selected day. |  |  |
| Goal | Plan calorie intake and meals according to personal goals. |  |  |
| Triggers | User opens meal planner or adds food to a date. |  |  |
| Preconditions | User is authenticated. |  |  |
| Post Conditions | Meal plan is created or updated with selected foods and quantities. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens meal planner for a date. | System loads or creates the meal plan for that date. |
| 2 | User adds a food item to the plan. | System saves the item into meal plan. |
| 3 | User updates quantity or removes an item. | System recalculates totals and stores the new state. |
| 4 | User reviews the final plan. | System displays updated calories and item list. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | User is not authenticated. | System denies access to meal plan APIs. |
| 2a | Invalid item or date is submitted. | System rejects the request. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Meal plan APIs are accessed without a valid login token. |
| 400 | Bad Request | Invalid date, food item, or quantity is submitted. |
| 404 | Not Found | Meal item or meal plan record cannot be found. |
| 500 | Internal Server Error | Server fails while adding, updating, or deleting meal plan items. |
### Business Rules

| Code | Rule |
|---|---|
| BR-18 | Meal plan is date-based and belongs to one authenticated user. |
| BR-19 | Item quantity changes must immediately affect nutrition totals. |

---

## USE CASE-11

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC11 | Use-case Version | 1.0 |
| Use-case Name | Get AI Nutrition Support | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User requests AI-based calorie goal, food recommendation, or calorie-limit analysis. |  |  |
| Goal | Assist meal planning with intelligent recommendations. |  |  |
| Triggers | User invokes AI functions in meal planner. |  |  |
| Preconditions | User is authenticated and has profile data. |  |  |
| Post Conditions | AI recommendation or analysis is returned to the user. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User requests AI meal support. | System reads profile and current meal data. |
| 2 | System calls AI meal-related service. | System receives goal or recommendation result. |
| 3 | Result is returned. | System displays AI suggestion to user. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | AI request fails. | System shows failure message or empty recommendation. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | AI nutrition support is requested without authentication. |
| 400 | Bad Request | Required user or meal context is incomplete for the AI request. |
| 500 | AI Service Error | AI nutrition calculation, recommendation, or calorie analysis fails. |
### Business Rules

| Code | Rule |
|---|---|
| BR-20 | AI meal support requires authentication. |

---

## USE CASE-12

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC12 | Use-case Version | 1.0 |
| Use-case Name | Browse and Add Workouts to Personal List | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User browses workout library and adds workouts to a personal plan. |  |  |
| Goal | Build an individual workout queue aligned with personal duration and calorie estimates. |  |  |
| Triggers | User opens workout page or clicks add workout. |  |  |
| Preconditions | User is authenticated for personal-list features. |  |  |
| Post Conditions | Selected workout is added to user workout list if not duplicated. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User browses workouts by category, level, or search. | System returns filtered workout library. |
| 2 | User selects a workout and planned duration. | System computes estimated calories. |
| 3 | User adds workout to personal list. | System stores a user-workout entry. |
| 4 | User reviews personal list. | System displays all user workouts and current statuses. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 3a | Same unfinished workout already exists in personal list. | System rejects duplicate addition. |
| 1a | Workout service fails. | System shows no data or error state. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Personal workout list actions require an authenticated user. |
| 400 | Bad Request | Duplicate unfinished workout is added to the personal list. |
| 500 | Internal Server Error | Server fails while loading workouts or creating a user-workout record. |
| Data Warning | Empty Result | No workouts match the selected filters or search terms. |
### Business Rules

| Code | Rule |
|---|---|
| BR-21 | A user cannot add the same unfinished workout twice. |
| BR-22 | Estimated calories are based on workout MET, user weight, and duration. |

---

## USE CASE-13

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC13 | Use-case Version | 1.0 |
| Use-case Name | Start, Finish, and Log Workout | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User starts a planned workout, finishes it, and stores workout logs. |  |  |
| Goal | Record training completion and burned calories for progress tracking. |  |  |
| Triggers | User clicks `Start` or `Finish` on a personal workout. |  |  |
| Preconditions | User has a workout in personal list. |  |  |
| Post Conditions | Workout status is updated and a workout log is created after completion. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User starts a workout. | System sets workout status to `in_progress` and stores start time. |
| 2 | User completes the workout. | System loads workout metadata and user body weight. |
| 3 | System calculates burned calories. | System creates a workout log entry and marks workout `completed`. |
| 4 | Completion succeeds. | System returns calories burned and updated progress data. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Workout cannot be found for the user. | System returns not found message. |
| 3a | Workout log creation fails. | System returns server error. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Start or finish workout action is attempted without valid login. |
| 404 | Not Found | Selected personal workout cannot be found for the current user. |
| 500 | Internal Server Error | Workout completion, calorie calculation, or log creation fails. |
### Business Rules

| Code | Rule |
|---|---|
| BR-23 | Calories burned are calculated from MET, user weight, and duration. |
| BR-24 | Completing a workout automatically creates a workout log. |

---

## USE CASE-14

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC14 | Use-case Version | 1.0 |
| Use-case Name | View Progress Statistics | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User views daily progress, streak, weekly overview, and workout history. |  |  |
| Goal | Provide measurable feedback about recent activity and consistency. |  |  |
| Triggers | User opens progress-related widgets or overview pages. |  |  |
| Preconditions | User is authenticated and has recorded activities. |  |  |
| Post Conditions | Progress summaries are shown on screen. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User requests progress view. | System fetches today progress, streak, weekly summary, or workout logs. |
| 2 | Backend aggregates recorded activity. | System returns calculated progress data. |
| 3 | User reviews charts and counters. | System renders updated insight panels. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | No logs exist yet. | System shows empty state with zero progress. |
| 2a | Aggregation fails. | System returns error and keeps page usable. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Progress services require a valid authenticated session. |
| 500 | Internal Server Error | Aggregation of daily, streak, weekly, or log data fails. |
| Data Warning | No Activity Data | No workout or progress records exist yet for the current user. |
### Business Rules

| Code | Rule |
|---|---|
| BR-25 | Progress data is generated from stored workout logs and related activity records. |

---

## USE CASE-15

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC15 | Use-case Version | 1.0 |
| Use-case Name | Ask AI Coach | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | User chats with HealthMate AI Coach and receives personalized advice. |  |  |
| Goal | Provide contextual guidance using profile, goals, meals, and workout history. |  |  |
| Triggers | User sends a message in AI Coach page. |  |  |
| Preconditions | User provides a non-empty message. |  |  |
| Post Conditions | AI reply is generated and optionally stored in chat history. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens AI Coach page. | System loads health metrics and current chat view. |
| 2 | User enters a question. | System validates that the message is not empty. |
| 3 | User sends the message. | System collects user context from profile, active goal, meals, and workouts. |
| 4 | System sends contextual prompt to Gemini AI. | System receives personalized advice. |
| 5 | AI response is returned. | System displays the reply in chat and stores it in session when applicable. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Message is empty. | System does not send the request. |
| 4a | AI service is unavailable or key is missing. | System returns AI error message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | AI coach request is sent with an empty message. |
| 500 | AI Configuration Error | Gemini API key is missing or the AI service is not correctly configured. |
| 500 | AI Service Error | AI request fails while building context, generating a reply, or saving session history. |
### Business Rules

| Code | Rule |
|---|---|
| BR-26 | AI responses are personalized using available user context. |
| BR-27 | Chat session is stored for valid database users. |

---

## USE CASE-16

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC16 | Use-case Version | 1.0 |
| Use-case Name | Use Community Feed | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | Guest, User |  |  |
| Summary | Users view posts, publish updates, like, save, and comment in the community feed. |  |  |
| Goal | Encourage sharing, engagement, and motivation among users. |  |  |
| Triggers | User opens community feed or posts new content. |  |  |
| Preconditions | Viewing feed requires no login; posting and interactions require authentication. |  |  |
| Post Conditions | New or updated post appears in the feed and may be broadcast via socket. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens community feed. | System loads posts and leaderboard preview. |
| 2 | Authenticated user writes content, attaches media or location, and posts. | System saves the post and emits a real-time feed update. |
| 3 | User likes, saves, or comments on a post. | System updates the post and emits refresh event. |
| 4 | User filters tabs such as all, AI, or saved. | System displays the matching posts. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | User is not logged in. | System redirects user to login for posting or interaction. |
| 2b | Upload or save fails. | System keeps current page and shows error state. |
| 3a | Post cannot be found. | System returns not found error. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Posting, liking, saving, or commenting is attempted without login. |
| 404 | Not Found | Target post cannot be found for like, save, or comment operations. |
| 500 | Internal Server Error | Server fails while saving post content, media, interaction, or socket update. |
| Upload Error | Media Upload Failed | Attached image or video fails during upload processing. |
### Business Rules

| Code | Rule |
|---|---|
| BR-28 | Global feed and group feed are supported. |
| BR-29 | Real-time updates use Socket.IO events. |
| BR-30 | AI-generated posts can be published automatically by scheduled job. |

---

## USE CASE-17

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC17 | Use-case Version | 1.0 |
| Use-case Name | Manage Community Groups | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User creates a group, joins or leaves groups, and views group-specific feeds. |  |  |
| Goal | Build smaller communities around shared interests or challenges. |  |  |
| Triggers | User opens group discovery or clicks create/join group. |  |  |
| Preconditions | User is authenticated for create/join actions. |  |  |
| Post Conditions | Group membership or group record is updated. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens community groups section. | System loads all available groups. |
| 2 | User creates a new group. | System stores group with creator as admin and first member. |
| 3 | User joins or leaves a group. | System toggles membership in the group record. |
| 4 | User opens group feed. | System loads group information and related posts. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | User is not authenticated. | System denies create-group action. |
| 3a | Group does not exist. | System returns not found message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Group creation or membership actions are attempted without login. |
| 404 | Not Found | Requested group cannot be found for viewing or membership update. |
| 500 | Internal Server Error | Server fails while creating the group or changing member status. |
### Business Rules

| Code | Rule |
|---|---|
| BR-31 | Group creator is automatically assigned as admin and member. |
| BR-32 | Join action also acts as leave action when user is already a member. |

---

## USE CASE-18

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC18 | Use-case Version | 1.0 |
| Use-case Name | View Leaderboard | Author | Project Team |
| Date | 22/03/2026 | Priority | Low |
| Actor | Guest, User |  |  |
| Summary | User views top community members based on exercise activity. |  |  |
| Goal | Promote motivation through ranking and friendly competition. |  |  |
| Triggers | User opens leaderboard panel or leaderboard page. |  |  |
| Preconditions | Exercise history data exists in user daily routine. |  |  |
| Post Conditions | Ranked user list is displayed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens leaderboard. | System aggregates exercise totals from user routines. |
| 2 | System sorts users by exercise count. | System displays top-ranked users. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | No exercise data exists. | System displays empty leaderboard message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 500 | Internal Server Error | Leaderboard aggregation fails on the server. |
| Data Warning | No Ranking Data | No users have enough routine activity to appear on the leaderboard. |
### Business Rules

| Code | Rule |
|---|---|
| BR-33 | Only users with exercise activity are shown in leaderboard results. |

---

## USE CASE-19

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC19 | Use-case Version | 1.0 |
| Use-case Name | View Admin Dashboard | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Admin |  |  |
| Summary | Admin monitors user statistics, growth charts, and recent system activity. |  |  |
| Goal | Support operational oversight of the HealthMate platform. |  |  |
| Triggers | Admin opens dashboard page. |  |  |
| Preconditions | Admin is authenticated and authorized. |  |  |
| Post Conditions | Dashboard statistics and chart data are displayed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Admin opens dashboard. | System verifies admin role. |
| 2 | System fetches total users, active sessions, growth, and recent activity. | System renders KPI cards and chart. |
| 3 | Admin changes time period. | System reloads chart data by day, week, or month. |
| 4 | Admin reviews system state. | System refreshes dashboard periodically. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | User is not admin. | System blocks access with protected routing or forbidden response. |
| 2a | Dashboard API fails. | System shows loading or fallback state. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Admin dashboard is requested without a valid token. |
| 403 | Forbidden | Authenticated user is not an admin. |
| 500 | Internal Server Error | Dashboard statistics or chart data fails to load. |
### Business Rules

| Code | Rule |
|---|---|
| BR-34 | All admin routes require both authentication and admin role. |
| BR-35 | Dashboard chart supports day, week, and month periods. |

---

## USE CASE-20

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC20 | Use-case Version | 1.0 |
| Use-case Name | Manage Users | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Admin |  |  |
| Summary | Admin creates, updates, searches, filters, and deletes user accounts. |  |  |
| Goal | Maintain user records and enforce account status. |  |  |
| Triggers | Admin opens user management module. |  |  |
| Preconditions | Admin is authenticated. |  |  |
| Post Conditions | User data is added, modified, or removed from the system. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Admin opens user management page. | System loads paginated user list. |
| 2 | Admin searches or filters by role and status. | System returns matching users. |
| 3 | Admin creates or updates a user. | System validates and saves account changes. |
| 4 | Admin deletes a user. | System removes user and related workout logs. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 3a | Email already exists. | System rejects user creation. |
| 4a | User is not found. | System returns not found message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | User management APIs are called without authentication. |
| 403 | Forbidden | Non-admin user attempts to manage accounts. |
| 400 | Bad Request | User creation fails because email already exists or payload is invalid. |
| 404 | Not Found | Target account cannot be found for update or delete. |
| 500 | Internal Server Error | Server fails during user CRUD operations. |
### Business Rules

| Code | Rule |
|---|---|
| BR-36 | Passwords are stored as hashes. |
| BR-37 | Deleting a user also deletes their workout logs in current implementation. |

---

## USE CASE-21

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC21 | Use-case Version | 1.0 |
| Use-case Name | Manage Food Catalog | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Admin |  |  |
| Summary | Admin creates, updates, and deletes food items with images and nutrition data. |  |  |
| Goal | Maintain a usable and accurate nutrition database. |  |  |
| Triggers | Admin opens food management pages. |  |  |
| Preconditions | Admin is authenticated. |  |  |
| Post Conditions | Food catalog records are created, updated, or removed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Admin opens food catalog management. | System loads all foods. |
| 2 | Admin creates or edits a food item with image upload. | System validates data and stores image plus nutrition details. |
| 3 | Admin deletes a food item. | System removes the record from catalog. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Uploaded file is invalid. | System rejects upload. |
| 3a | Food item is not found. | System returns not found message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Food catalog management is attempted without login. |
| 403 | Forbidden | Non-admin user attempts to create, update, or delete food records. |
| 404 | Not Found | Food item cannot be found for edit or delete. |
| 500 | Internal Server Error | Food persistence or upload handling fails. |
| Upload Error | Invalid File | Uploaded file type or image handling is invalid. |
### Business Rules

| Code | Rule |
|---|---|
| BR-38 | Create, update, and delete food actions are admin-only. |
| BR-39 | Image upload is handled through multipart form-data middleware. |

---

## USE CASE-22

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC22 | Use-case Version | 1.0 |
| Use-case Name | Manage Workout Library | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | Admin |  |  |
| Summary | Admin creates, updates, filters, and deletes workouts in the workout library. |  |  |
| Goal | Keep workout database complete and current for user planning. |  |  |
| Triggers | Admin opens workout management page. |  |  |
| Preconditions | Admin has access to workout management UI. |  |  |
| Post Conditions | Workout library records are maintained. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Admin opens workout management page. | System loads existing workouts. |
| 2 | Admin applies filters or searches. | System returns matching workout items. |
| 3 | Admin creates or edits a workout. | System saves workout details in database. |
| 4 | Admin deletes a workout. | System removes the workout from library. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 3a | Workout data is invalid. | System rejects create or update action. |
| 4a | Workout ID is invalid or missing. | System returns error message. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Workout payload or identifier is invalid. |
| 404 | Not Found | Workout record cannot be found for update, detail, or delete. |
| 500 | Internal Server Error | Server fails while maintaining workout templates. |
| Authorization Gap | Route Not Protected | Current backend route file allows broader access than the intended admin UI. |
### Business Rules

| Code | Rule |
|---|---|
| BR-40 | Workout listing supports filter by category, level, and search keyword. |
| BR-41 | Workout records include MET values used for calorie estimation. |

---

## USE CASE-23

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC23 | Use-case Version | 1.0 |
| Use-case Name | Run Admin Maintenance Actions | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | Admin |  |  |
| Summary | Admin triggers backup, recovery, log viewing, and performance monitoring actions. |  |  |
| Goal | Support basic platform maintenance and diagnostics. |  |  |
| Triggers | Admin clicks maintenance actions in dashboard or related pages. |  |  |
| Preconditions | Admin is authenticated. |  |  |
| Post Conditions | Maintenance response or diagnostic data is returned. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Admin requests system logs, performance, backup, or recovery. | System verifies admin privileges. |
| 2 | Backend executes or simulates the requested maintenance operation. | System returns result message and related data. |
| 3 | Admin reviews outcome. | System displays status or action summary. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Maintenance endpoint fails. | System returns server error. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Maintenance endpoints are called without authentication. |
| 403 | Forbidden | Non-admin user attempts maintenance actions. |
| 500 | Internal Server Error | Logs, performance, backup, or recovery action fails. |
| Functional Gap | Placeholder Operation | Backup and recovery currently return mock or placeholder responses. |
### Business Rules

| Code | Rule |
|---|---|
| BR-42 | Current backup and recovery flows are placeholder implementations in backend. |

---

## USE CASE-24

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC24 | Use-case Version | 1.0 |
| Use-case Name | Complete Initial Onboarding | Author | Project Team |
| Date | 22/03/2026 | Priority | High |
| Actor | User |  |  |
| Summary | Newly registered user completes the first-time onboarding form with body information and broad goal. |  |  |
| Goal | Ensure the system has the minimum profile data required for personalization. |  |  |
| Triggers | User is redirected to onboarding after registration or incomplete login. |  |  |
| Preconditions | User is authenticated but profile is incomplete. |  |  |
| Post Conditions | User profile is updated and user is redirected to homepage. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens onboarding page. | System displays profile completion form. |
| 2 | User enters gender, height, weight, and overall goal. | System validates all required values. |
| 3 | User submits onboarding form. | System updates profile through `/api/users/me`. |
| 4 | Update succeeds. | System refreshes stored profile and redirects to homepage. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Required onboarding fields are missing. | System blocks submission and asks user to fill all fields. |
| 2b | Height or weight is unrealistically low. | System returns validation error. |
| 3a | Profile save fails. | System keeps user on onboarding page and shows error. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Onboarding form is incomplete or body metrics are invalid. |
| 401 | Unauthorized | User is redirected to login when onboarding token is missing or expired. |
| 500 | Internal Server Error | Server fails while saving onboarding profile data. |
### Business Rules

| Code | Rule |
|---|---|
| BR-43 | Onboarding requires gender, height, weight, and broad goal. |
| BR-44 | Onboarding is the minimum data gate before full homepage flow. |

---

## USE CASE-25

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC25 | Use-case Version | 1.0 |
| Use-case Name | Daily Body Check-in and AI Review | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User records body metrics for a day and receives short AI feedback on progress. |  |  |
| Goal | Support lightweight daily or periodic self-check tracking outside weekly goal check-ins. |  |  |
| Triggers | User submits weight and height in Overview page. |  |  |
| Preconditions | User is authenticated. |  |  |
| Post Conditions | Check-in is saved locally for history and AI progress feedback is displayed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens Overview page. | System loads daily calories, workout data, and local check-in history. |
| 2 | User enters current weight and height. | System validates metrics and computes BMI. |
| 3 | User submits check-in. | System stores the entry in local history. |
| 4 | System calls progress analysis AI endpoint. | System returns short coaching feedback about weight change. |
| 5 | User reviews output. | System shows AI review and recent check-in history. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Weight or height is missing. | System blocks submission. |
| 2b | Values are invalid or not greater than zero. | System shows validation error. |
| 4a | AI analysis fails. | System still stores local check-in but no AI review is shown. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Weight or height is missing or less than or equal to zero. |
| 401 | Unauthorized | AI progress analysis is requested without valid authentication. |
| 500 | Internal Server Error | Progress analysis request fails on the server. |
| Local Data Warning | Local History Only | Body check-in history is stored locally and may not sync across devices. |
### Business Rules

| Code | Rule |
|---|---|
| BR-45 | Overview check-in history is currently stored in local storage. |
| BR-46 | AI review compares old weight and current weight through `/api/goals/analyze-progress`. |

---

## USE CASE-26

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC26 | Use-case Version | 1.0 |
| Use-case Name | View Daily Overview by Selected Date | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User switches between dates to review calories in, calories burned, workout time, and upcoming routine. |  |  |
| Goal | Provide a day-centric operational summary rather than only long-term analytics. |  |  |
| Triggers | User changes the selected date in Overview page. |  |  |
| Preconditions | User is authenticated. |  |  |
| Post Conditions | Date-specific nutrition and workout data are displayed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User picks a date. | System requests meal plan and workout logs for that date. |
| 2 | System aggregates daily calories in, calories burned, sessions, and total duration. | System updates metric cards. |
| 3 | System calculates weekly calories around the chosen date. | System refreshes weekly performance bars. |
| 4 | System checks scheduled routine for the chosen date. | System displays upcoming workout card or empty state. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | There is no meal plan or workout log for selected date. | System shows zero values or empty state. |
| 4a | No scheduled routine exists. | System shows no-schedule message and navigation action to workouts. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Date-based overview data is requested without login. |
| 500 | Internal Server Error | Meal plan, workout logs, or routine retrieval fails for the selected date. |
| Data Warning | No Daily Records | Chosen date has no associated meals, workouts, or routine entries. |
### Business Rules

| Code | Rule |
|---|---|
| BR-47 | Overview data is derived from meal plans, workout logs, and daily routine service. |

---

## USE CASE-27

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC27 | Use-case Version | 1.0 |
| Use-case Name | View and Interact with Schedule Planner | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User views a weekly or monthly schedule layout containing meals, workouts, rest days, and task reminders. |  |  |
| Goal | Centralize planned activity timing and routine adherence. |  |  |
| Triggers | User opens schedule page. |  |  |
| Preconditions | User is authenticated. |  |  |
| Post Conditions | Calendar-style schedule and task widgets are displayed. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens schedule page. | System displays weekly schedule layout with event cards. |
| 2 | User switches between week and month view. | System updates the visible planner mode. |
| 3 | User reviews workout, meal, and rest entries. | System highlights today and summarizes daily totals. |
| 4 | User marks a task done. | System updates the task status in page state. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 3a | No event exists for a day. | System displays rest or blank state. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| Functional Gap | Static Planner Data | Current schedule page uses primarily static sample calendar data. |
| Client Warning | Unsaved Task State | Task toggles exist only in local page state and are not persisted to backend. |
### Business Rules

| Code | Rule |
|---|---|
| BR-48 | Current schedule page is primarily a UI planner with static sample event data. |
| BR-49 | Task checklist state is handled on the client side. |

---

## USE CASE-28

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC28 | Use-case Version | 1.0 |
| Use-case Name | View Side Schedule Planner Widget | Author | Project Team |
| Date | 22/03/2026 | Priority | Low |
| Actor | User |  |  |
| Summary | User uses the compact schedule planner widget to select dates and preview scheduled events. |  |  |
| Goal | Provide a quick-glance planner component reusable beside workout or dashboard views. |  |  |
| Triggers | User clicks a date in the planner widget. |  |  |
| Preconditions | Parent page provides `days`, `eventsByDate`, and selected date. |  |  |
| Post Conditions | Selected date changes and matching event list is shown. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User views the planner widget. | System renders a 7-day clickable grid. |
| 2 | User clicks a day. | System updates selected date through callback. |
| 3 | System loads events for the chosen date. | Widget displays the selected day’s workouts in weekly overview area. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 3a | Chosen date has no events. | Widget shows “No workouts scheduled”. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| Data Warning | No Scheduled Events | The selected date contains no workouts or planner events. |
| Input Error | Missing Props | Parent page does not provide the data required by the planner widget. |
### Business Rules

| Code | Rule |
|---|---|
| BR-50 | The planner widget is a reusable presentational component driven by props. |

---

## USE CASE-29

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC29 | Use-case Version | 1.0 |
| Use-case Name | Create and Maintain Custom Workout Library Entries | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User, Admin |  |  |
| Summary | Actor creates custom workouts, defines exercises, and maintains workout detail records. |  |  |
| Goal | Expand the workout library with custom or manually curated programs. |  |  |
| Triggers | Actor clicks `Create Workout`, `Edit`, or `Delete` on workout pages. |  |  |
| Preconditions | Workout creation form is available; workout detail page is opened with a valid ID for edit/delete. |  |  |
| Post Conditions | Workout is created, updated, or deleted in the workout library. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Actor opens create workout modal or workout detail page. | System displays workout form fields and exercises list. |
| 2 | Actor enters title, category, level, description, calories, and exercises. | System tracks form changes. |
| 3 | Actor submits create or update action. | System saves the workout into backend. |
| 4 | Actor deletes a workout if needed. | System removes the workout and redirects back to listing. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Required workout fields are missing. | System rejects the request or shows failure. |
| 4a | User cancels the delete confirmation. | System keeps the workout unchanged. |
| 4b | Workout ID is invalid or not found. | System returns error from backend. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Workout creation or update payload is incomplete or invalid. |
| 404 | Not Found | Workout detail record cannot be found by the supplied identifier. |
| 500 | Internal Server Error | Server fails while creating, updating, or deleting custom workouts. |
| Client Warning | Delete Cancelled | User cancels the delete confirmation dialog. |
### Business Rules

| Code | Rule |
|---|---|
| BR-51 | Custom workout creation supports multiple exercises with title, video URL, duration, and order. |
| BR-52 | Workout detail page supports embedded YouTube exercise videos. |

---

## USE CASE-30

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC30 | Use-case Version | 1.0 |
| Use-case Name | Manage Workout Logs in Legacy Workout Manager | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User manually records workout logs, creates workout templates, and reviews recent workout history in the legacy manager page. |  |  |
| Goal | Support manual exercise logging and quick personal workout administration. |  |  |
| Triggers | User opens Workout Manager page and submits forms. |  |  |
| Preconditions | User is authenticated. |  |  |
| Post Conditions | Workout log or workout template is created; history and quick stats are updated. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User opens Workout Manager page. | System loads workouts and recent workout logs. |
| 2 | User selects a workout and enters duration, calories, and notes. | System validates form values. |
| 3 | User saves the workout log. | System sends a create-log request and refreshes history. |
| 4 | User optionally switches to create-workout mode. | System displays a workout template creation form. |
| 5 | User deletes a past log. | System removes the record and refreshes statistics. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Required fields are missing. | System shows validation error. |
| 3a | Tracker log API fails. | System shows connection or save error. |
| 5a | Delete request fails. | System displays failure alert. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Legacy workout manager is opened without a valid token. |
| 500 | Internal Server Error | Tracker-based workout logs fail to load or save. |
| Integration Gap | Missing Tracker Routes | Frontend references /api/tracker/... endpoints that are not mounted in the current backend bootstrap. |
| Client Error | Delete Failed | Workout log deletion request fails and the record remains visible. |
### Business Rules

| Code | Rule |
|---|---|
| BR-53 | This page depends on `/api/tracker/...` endpoints referenced by the project but not mounted in the current `server.js`. |
| BR-54 | Legacy workout manager and current user-workout flow coexist in the repository. |

---

## USE CASE-31

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC31 | Use-case Version | 1.0 |
| Use-case Name | Manage Meal Plans for Specific Users as Admin | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | Admin |  |  |
| Summary | Admin selects a user, browses meal plans by date, and modifies meal items for that user. |  |  |
| Goal | Allow administrative nutritional planning and support for individual users. |  |  |
| Triggers | Admin opens Admin Meal Planner page. |  |  |
| Preconditions | Admin is authenticated and user list is accessible. |  |  |
| Post Conditions | User-targeted meal plans are viewed and updated. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Admin opens meal planner management. | System loads users and current selected date. |
| 2 | Admin selects a target user. | System reloads the chosen user’s meal plan and weekly calorie data. |
| 3 | Admin adds, edits quantity, or removes foods for that date. | System updates the meal plan through meal-plan APIs. |
| 4 | Admin reviews calorie ring, macro estimate, and 7-day bars. | System shows computed nutrition summaries. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Target user is not chosen. | System defaults to admin self-view. |
| 3a | Add or update request fails. | System shows toast error message. |
| 3b | Quantity is outside allowed range. | System blocks update. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | Admin meal planner is accessed without authentication. |
| 403 | Forbidden | Non-admin user attempts to manage another user's meal plan. |
| 400 | Bad Request | Quantity is invalid or target payload is malformed. |
| 500 | Internal Server Error | Server fails while loading users, meal plans, or applying meal updates. |
### Business Rules

| Code | Rule |
|---|---|
| BR-55 | Admin meal planner uses the same meal-plan endpoints with optional target user context from the UI. |
| BR-56 | Meal items are visually grouped into meal slots on the frontend. |

---

## USE CASE-32

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC32 | Use-case Version | 1.0 |
| Use-case Name | Manage Workout Categories | Author | Project Team |
| Date | 22/03/2026 | Priority | Low |
| Actor | Admin, Maintainer |  |  |
| Summary | Actor creates, updates, lists, and deletes workout categories used by workout filtering. |  |  |
| Goal | Keep workout classification organized for browsing and management. |  |  |
| Triggers | Category service or category API is invoked. |  |  |
| Preconditions | Workout category routes are reachable. |  |  |
| Post Conditions | Workout category records are maintained. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | Actor requests category list. | System returns all workout categories. |
| 2 | Actor creates or updates a category. | System stores the category in database. |
| 3 | Actor deletes a category. | System removes the category record. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 2a | Category payload is invalid. | System returns server or validation error. |
| 3a | Category is not found. | System returns error on update or delete. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 400 | Bad Request | Category data is invalid for create or update action. |
| 404 | Not Found | Workout category record cannot be found for modification. |
| 500 | Internal Server Error | Category CRUD operation fails in the backend. |
| Authorization Gap | Route Not Protected | Current route file does not enforce auth despite administrative intent. |
### Business Rules

| Code | Rule |
|---|---|
| BR-57 | Workout listing filters depend on category identifiers from this module. |
| BR-58 | Current category routes do not enforce auth in the route file. |

---

## USE CASE-33

| Field | Value | Field | Value |
|---|---|---|---|
| Use-case No. | UC33 | Use-case Version | 1.0 |
| Use-case Name | Get AI Workout Recommendation | Author | Project Team |
| Date | 22/03/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | User requests AI-selected workouts from the existing workout library based on body metrics and goal. |  |  |
| Goal | Recommend suitable workouts without inventing new ones outside the library. |  |  |
| Triggers | Frontend calls AI recommendation endpoint. |  |  |
| Preconditions | User is authenticated and workout library exists. |  |  |
| Post Conditions | Recommended workout records are returned from the library. |  |  |

### Main Success Scenario

| Step | Actor Event | System Response |
|---|---|---|
| 1 | User requests an AI workout recommendation. | System loads user profile and current workout library. |
| 2 | System builds a prompt with height, weight, BMI, body type, and goal. | Gemini AI receives the constrained recommendation request. |
| 3 | AI returns workout names in JSON array format. | System matches AI names back to actual library records. |
| 4 | Result is returned. | User receives recommended workouts from the existing catalog. |

### Alternative Scenario

| Step | Action | Use case |
|---|---|---|
| 1a | User cannot be found. | System returns not found error. |
| 3a | AI output cannot be parsed. | System falls back to an empty recommendation list. |
| 3b | AI names do not match library items. | Unmatched results are dropped. |

### Exceptions
| Exception code | Message | Caught |
|---|---|---|
| 401 | Unauthorized | AI workout recommendation is requested without valid authentication. |
| 404 | Not Found | Authenticated user cannot be found before recommendation generation. |
| 500 | AI Service Error | Gemini request fails or output cannot be processed reliably. |
| Parsing Warning | Empty Recommendation | AI output cannot be parsed or matched to existing workout library records. |
### Business Rules

| Code | Rule |
|---|---|
| BR-59 | AI is instructed to choose only from the existing workout library. |
| BR-60 | Recommendation endpoint is protected and requires login. |

---

## Notes

- These feature descriptions are based on the current source code in `frontend/src` and `backend/routes`, `backend/controllers`.
- Some UI pages exist as prototypes or partial implementations, so this document focuses on features that are clearly represented in the running code.
- You can directly convert each markdown table into a Word table for the final report.
- The repository currently contains two overlapping implementation lines for tracking and workout management:
  - Current line: `progress`, `workout-logs`, `user-workouts`, `goals`, `meal-plans`, `community`, `admin`.
  - Legacy/experimental line: pages and test docs referencing `/api/tracker/...`, especially `DashboardPage.tsx` and `WorkoutManagerPage.tsx`.
- The legacy tracker endpoints are referenced in frontend and test documents, but they are not mounted in [server.js](c:/SE/Spring.2026/WDP/Healthmate/backend/server.js) in the current backend bootstrapping.
- Some routes expose broader access than the protected UI suggests. For example, workout and workout-category route files currently do not enforce admin-only protection in the backend route definitions.


