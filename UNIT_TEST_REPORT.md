# Unit Test Report

## Document Information

| Item | Value | Item | Value |
| --- | --- | --- | --- |
| Project Name | HealthMate | Creator | Namph |
| Project Code | HM | Reviewer / Approver | Group 6 |
| Document Code | HM_UnitTest_v1.4 | Issue Date | 27/03/2026 |
| Project Duration | 14/02/2026 - 27/03/2026 | Version | 1.4 |

## Record of Change

| Effective Date | Version | Change Item | A/D/M | Reference |
| --- | --- | --- | --- | --- |
| 14/02/2026 | 1.0 | Create repository, initialize project structure, and define the initial unit test report skeleton | A | Initial draft |
| 28/02/2026 | 1.1 | Add frontend helper and frontend service unit test cases for goal and progress flows | A | Frontend module update |
| 14/03/2026 | 1.2 | Add backend controller unit test cases for goal generation, weekly check-in, and admin user/chart functions | A | Backend module update |
| 27/03/2026 | 1.3 | Review, refine normal, boundary, and abnormal combinations, and finalize the unit test case report | M | Final review |
| 27/03/2026 | 1.4 | Expand FunctionList to cover the full system and update the report to use optional KLOC reference only | M | Full-system coverage update |

## 1. General Information

| Item | Value |
| --- | --- |
| Project Name | HealthMate |
| Project Type | Full-stack health, fitness, meal planning, AI coaching, and community platform |
| Frontend Stack | React 19, TypeScript, Vite, React Router |
| Backend Stack | Node.js, Express, MongoDB/Mongoose, Socket.IO |
| Main Scope of This Report | Full-system function inventory covering the main user, AI, community, and admin modules, with detailed unit test sheets for representative core functions |
| Test Technique | Black-box unit test design using normal, boundary, and abnormal input values |
| Report Status | Draft unit test case report with full-system function inventory |
| Execution Status | Not executed yet |
| Normal Number of Test Cases/KLOC | Optional / customer-defined if needed |
| Formula Used | If a norm is required by customer, `Required TC = CEILING(LOC x reference KLOC value / 1000)` |
| Result Legend | `P` = Passed, `F` = Failed, `N/E` = Not Executed |
| Important Note | The current repository does not include a dedicated unit test framework yet. This document is therefore a designed unit test report/specification. The FunctionList covers the full system, while detailed test sheets are currently prepared for a representative subset of core functions. |

### 1.1 Scope Notes

- Frontend helper functions inside the fitness goal page are currently non-exported. For real unit test implementation, these helpers should be extracted/exported or tested via module-level isolation.
- Frontend service functions can be unit tested by mocking `fetch` and `localStorage`.
- Backend controller functions can be unit tested by mocking `req`, `res`, Mongoose models, and the Gemini API client.
- The FunctionList in section `2.1` is intended to cover the whole implemented system at module/function level.
- The detailed function sheets in section `3` focus first on representative and higher-risk functions so the report remains manageable for submission.

## 2. FunctionList

### 2.1 Unit Test Case List Sheet

| Item | Value |
| --- | --- |
| Project Name | HealthMate |
| Project Code | HM |
| Normal number of Test cases/KLOC | Optional - not fixed for this full-system version |
| Test Environment Setup Description | 1. Application Server: Node.js and Express backend, or mocked controller runtime. 2. Database: MongoDB test database or mocked Mongoose models. 3. Web Browser: Google Chrome or Microsoft Edge for frontend service behavior. 4. Test Tools: Vitest or Jest, mocked `fetch`, mocked `localStorage`, and mocked `req`/`res` objects. |

| No | Requirement Name | Class Name | Function Name | Function Code (Optional) | Sheet Name | Description | Pre-Condition |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Authentication | UserController | `registerUser` | UT-AU-01 | `registerUser` | Register a new account with hashed password and initial profile data. | Valid registration payload is prepared and email uniqueness can be checked. |
| 2 | Authentication | UserController | `loginUser` | UT-AU-02 | `loginUser` | Authenticate user credentials and issue access token. | Existing user record and password hash are available or mocked. |
| 3 | Authentication | UserController | `googleLogin` | UT-AU-03 | `googleLogin` | Create or authenticate an account using Google login data. | Valid Google profile payload is provided. |
| 4 | User Profile | UserController | `getMe` | UT-UP-01 | `getMe` | Return the authenticated user's own profile information. | Authentication middleware has attached the current user. |
| 5 | User Profile | UserController | `updateProfile` | UT-UP-02 | `updateProfile` | Update personal profile information for the authenticated user. | Authenticated user exists and update payload is prepared. |
| 6 | Daily Routine | UserController | `getDailyRoutine` | UT-RT-01 | `getDailyRoutine` | Retrieve the user's daily routine data. | Authenticated user exists. |
| 7 | Daily Routine | UserController | `updateDailyRoutine` | UT-RT-02 | `updateDailyRoutine` | Update or replace daily routine entries for the user. | Authenticated user exists and routine payload is prepared. |
| 8 | Health Metrics | UserController | `getHealthMetrics` | UT-HM-01 | `getHealthMetrics` | Calculate and return health metrics and dashboard values. | Authenticated user profile and related activity data exist or are mocked. |
| 9 | Fitness Goals | GoalController | `getUserGoal` | UT-GO-01 | `getUserGoal` | Retrieve the active goal of the authenticated user. | Authenticated user exists and active goal may exist or be empty. |
| 10 | Fitness Goals | GoalController | `createGoal` | UT-GO-02 | `createGoal` | Create a new goal for the authenticated user. | Authenticated user exists and goal payload is valid. |
| 11 | Fitness Goals | GoalController | `updateGoal` | UT-GO-03 | `updateGoal` | Update an existing goal by ID. | Target goal exists or mocked update path is prepared. |
| 12 | Fitness Goals | GoalController | `deleteGoal` | UT-GO-04 | `deleteGoal` | Delete an existing goal by ID. | Target goal exists or mocked delete path is prepared. |
| 13 | Fitness Goals | GoalController | `generateAIRoadmap` | UT-GO-05 | `generateAIRoadmap` | Validate input, call Gemini AI, archive old goals, and create roadmap phases and micro goals. | Authenticated user context exists, database mocks are ready, and Gemini is mocked or configured. |
| 14 | Fitness Goals | GoalController | `checkinWeekly` | UT-GO-06 | `checkinWeekly` | Save or update a weekly check-in record for the current goal. | Authenticated user exists and target goal ID is available. |
| 15 | Fitness Goals | GoalController | `analyzeProgress` | UT-GO-07 | `analyzeProgress` | Use AI to analyze weight change and return motivational feedback. | Authenticated user exists and progress payload is prepared. |
| 16 | Micro Goals | MicroGoalController | `getMicroGoals` | UT-MG-01 | `getMicroGoals` | Retrieve micro goals linked to a goal. | Goal ID exists or is mocked. |
| 17 | Micro Goals | MicroGoalController | `createMicroGoal` | UT-MG-02 | `createMicroGoal` | Add a new micro goal to a target goal. | Authenticated user and valid goal ID exist. |
| 18 | Micro Goals | MicroGoalController | `toggleMicroGoal` | UT-MG-03 | `toggleMicroGoal` | Toggle the completion status of a micro goal. | Target micro goal exists. |
| 19 | Micro Goals | MicroGoalController | `deleteMicroGoal` | UT-MG-04 | `deleteMicroGoal` | Remove a micro goal from the system. | Target micro goal exists. |
| 20 | Progress Tracking | ProgressController | `getTodayProgress` | UT-PR-01 | `getTodayProgress` | Return the current day's progress summary. | Authenticated user exists and daily logs can be read or mocked. |
| 21 | Progress Tracking | ProgressController | `getStreak` | UT-PR-02 | `getStreak` | Calculate activity streak for the authenticated user. | Authenticated user exists and workout/progress history is available or mocked. |
| 22 | Progress Tracking | ProgressController | `getWeeklyOverview` | UT-PR-03 | `getWeeklyOverview` | Build a weekly overview of activity and calorie data. | Authenticated user exists and weekly data is available or mocked. |
| 23 | Food Catalog | FoodController | `getAllFoods` | UT-FD-01 | `getAllFoods` | Return the global list of food items with optional filters. | Food dataset exists or is mocked. |
| 24 | Food Catalog | FoodController | `getFoodById` | UT-FD-02 | `getFoodById` | Return details of a single food item by ID. | Food ID is provided and may be valid or invalid. |
| 25 | Food Catalog | FoodController | `createFood` | UT-FD-03 | `createFood` | Create a new food item with nutrition data. | Admin authentication exists and valid food payload is prepared. |
| 26 | Food Catalog | FoodController | `updateFood` | UT-FD-04 | `updateFood` | Update an existing food item and its metadata. | Admin authentication exists and target food record exists or is mocked. |
| 27 | Food Catalog | FoodController | `deleteFood` | UT-FD-05 | `deleteFood` | Delete an existing food item by ID. | Admin authentication exists and target food exists or is mocked. |
| 28 | Food Recommendation | FoodController | `getRecommendedFoods` | UT-FD-06 | `getRecommendedFoods` | Use AI to recommend foods based on profile and goal. | Authenticated user exists and food dataset is available. |
| 29 | Meal Planner | MealPlanController | `getMealPlanByDate` | UT-ML-01 | `getMealPlanByDate` | Return the meal plan for a specific user and date. | Authenticated user exists and date input is prepared. |
| 30 | Meal Planner | MealPlanController | `addFoodToMealPlan` | UT-ML-02 | `addFoodToMealPlan` | Add a food item into a user's meal plan and recalculate totals. | Authenticated user exists, date exists, and food ID is valid or mocked. |
| 31 | Meal Planner | MealPlanController | `removeFoodFromMealPlan` | UT-ML-03 | `removeFoodFromMealPlan` | Remove a food item from the meal plan. | Authenticated user exists and meal plan item exists or is mocked. |
| 32 | Meal Planner | MealPlanController | `updateFoodQuantity` | UT-ML-04 | `updateFoodQuantity` | Update quantity of a meal item and refresh calories/macros. | Authenticated user exists and target meal plan item exists. |
| 33 | Meal Planner | MealPlanController | `calculateAIGoal` | UT-ML-05 | `calculateAIGoal` | Ask AI to calculate target calories/macros from the user profile and goal. | Authenticated user exists and AI client is available or mocked. |
| 34 | Meal Planner | MealPlanController | `getAIRecommendations` | UT-ML-06 | `getAIRecommendations` | Return AI-based meal recommendations for the user. | Authenticated user exists and AI client is available or mocked. |
| 35 | Meal Planner | MealPlanController | `analyzeCaloriesLimit` | UT-ML-07 | `analyzeCaloriesLimit` | Analyze calorie overconsumption and return AI warning text. | Authenticated user exists and request body with calorie values is prepared. |
| 36 | Workout Logs | WorkoutLogController | `createWorkoutLog` | UT-WL-01 | `createWorkoutLog` | Create a workout log record for a completed workout. | Authenticated user exists and workout log payload is prepared. |
| 37 | Workout Logs | WorkoutLogController | `getMyWorkoutLogs` | UT-WL-02 | `getMyWorkoutLogs` | Return workout log history of the authenticated user. | Authenticated user exists. |
| 38 | AI Coach | ChatController | `askAICoach` | UT-AI-01 | `askAICoach` | Build personalized context and return AI coaching response. | Authenticated user exists and Gemini or chat session mocks are available. |
| 39 | AI Coach | AIController | `recommendWorkout` | UT-AI-02 | `recommendWorkout` | Recommend workouts using AI based on profile and target. | Authenticated user exists and AI client is available or mocked. |
| 40 | Subscription | SubscriptionController | `createPaymentLink` | UT-SB-01 | `createPaymentLink` | Create a payment link for subscription upgrade. | Authenticated user exists and PayOS config is available or mocked. |
| 41 | Subscription | SubscriptionController | `upgradeToPro` | UT-SB-02 | `upgradeToPro` | Upgrade the user subscription to Pro after payment success. | Authenticated user exists and upgrade payload is prepared. |
| 42 | Subscription | SubscriptionController | `downgradeToFree` | UT-SB-03 | `downgradeToFree` | Downgrade the user subscription back to Free. | Authenticated user exists. |
| 43 | Workout Library | WorkoutService / WorkoutRoutes | `getWorkouts` | UT-WO-01 | `getWorkouts` | Retrieve workout library with category, level, and search filtering. | Workout dataset exists or is mocked. |
| 44 | Workout Library | WorkoutService / WorkoutRoutes | `getWorkoutById` | UT-WO-02 | `getWorkoutById` | Retrieve workout detail by workout ID. | Workout ID is prepared and may be valid or invalid. |
| 45 | Personal Workout Plan | WorkoutService / UserWorkoutRoutes | `addWorkoutPlan` | UT-WO-03 | `addWorkoutPlan` | Add a workout into the user's personal plan. | Authenticated user exists and workout ID is valid or mocked. |
| 46 | Personal Workout Plan | WorkoutService / UserWorkoutRoutes | `startWorkout` | UT-WO-04 | `startWorkout` | Start a planned workout and update its status to in-progress. | Authenticated user exists and planned workout item exists. |
| 47 | Personal Workout Plan | WorkoutService / UserWorkoutRoutes | `finishWorkout` | UT-WO-05 | `finishWorkout` | Complete a planned workout and create the related workout log. | Authenticated user exists and planned workout item exists. |
| 48 | Personal Workout Plan | WorkoutService / UserWorkoutRoutes | `removeWorkoutPlan` | UT-WO-06 | `removeWorkoutPlan` | Remove a workout from the user's personal list. | Authenticated user exists and target plan item exists. |
| 49 | Workout Categories | CategoryService | `getCategories` | UT-WO-07 | `getCategories` | Retrieve workout category filters used by the workout library screen. | Category dataset exists or is mocked. |
| 50 | Community Feed | CommunityRoutes | `GET /posts` | UT-CM-01 | `viewPosts` | Return community feed posts and inject initial AI post when needed. | Post dataset exists or is mocked. |
| 51 | Community Feed | CommunityRoutes | `POST /posts` | UT-CM-02 | `createPost` | Create a new community post with optional media upload. | Authenticated user exists and multipart or post content payload is prepared. |
| 52 | Community Feed | CommunityRoutes | `PUT /posts/:id/like` | UT-CM-03 | `likePost` | Toggle like state of a community post and emit realtime update. | Authenticated user exists and target post exists. |
| 53 | Community Feed | CommunityRoutes | `POST /posts/:id/comment` | UT-CM-04 | `commentPost` | Add a comment to a community post. | Authenticated user exists and target post exists. |
| 54 | Community Feed | CommunityRoutes | `PUT /posts/:id/save` | UT-CM-05 | `savePost` | Toggle saved-post state for the current user. | Authenticated user exists and target post exists. |
| 55 | Community Feed | CommunityRoutes | `GET /leaderboard` | UT-CM-06 | `viewLeaderboard` | Build leaderboard rankings from routines, posts, and challenges. | User, post, and challenge data are available or mocked. |
| 56 | Groups | CommunityRoutes | `GET /groups` | UT-CM-07 | `viewGroups` | Return all community groups with members and admin data. | Group dataset exists or is mocked. |
| 57 | Groups | CommunityRoutes | `POST /groups` | UT-CM-08 | `createGroup` | Create a new community group. | Authenticated user exists and group payload is prepared. |
| 58 | Groups | CommunityRoutes | `PUT /groups/:id/join` | UT-CM-09 | `joinGroup` | Join or leave a community group. | Authenticated user exists and target group exists. |
| 59 | Challenges | CommunityRoutes | `GET /challenges` | UT-CM-10 | `viewChallenges` | Return public or joined challenges visible to the user. | Authenticated user exists and challenge dataset is available or mocked. |
| 60 | Challenges | CommunityRoutes | `POST /challenges` | UT-CM-11 | `createChallenge` | Create a public or private challenge and optionally publish it to the feed. | Authenticated user exists and challenge payload is prepared. |
| 61 | Challenges | CommunityRoutes | `PUT /challenges/:id/join` | UT-CM-12 | `joinChallenge` | Join an existing challenge. | Authenticated user exists and target challenge exists. |
| 62 | Admin Dashboard | AdminController | `getDashboardStats` | UT-AD-01 | `getDashboardStats` | Aggregate user, workout, and activity metrics for the admin dashboard. | Admin authentication exists and datasets are seeded or mocked. |
| 63 | Admin Dashboard | AdminController | `getChartData` | UT-AD-02 | `getChartData` | Build time-based growth chart data for the admin dashboard. | Admin authentication exists and aggregate data is seeded or mocked. |
| 64 | Admin User Management | AdminController | `getUsers` | UT-AD-03 | `getUsers` | Return filtered and paginated user records for moderation. | Admin authentication exists and user dataset is seeded or mocked. |
| 65 | Admin User Management | AdminController | `createUser` | UT-AD-04 | `createUser` | Create a new user account from the admin console. | Admin authentication exists and valid user payload is prepared. |
| 66 | Admin User Management | AdminController | `updateUser` | UT-AD-05 | `updateUser` | Update role, status, profile, or password of a selected user. | Admin authentication exists and target user exists or is mocked. |
| 67 | Admin User Management | AdminController | `deleteUser` | UT-AD-06 | `deleteUser` | Delete a user and related workout logs. | Admin authentication exists and target user exists or is mocked. |
| 68 | Admin System | AdminController | `getSystemLogs` | UT-AD-07 | `getSystemLogs` | Return system log summary for monitoring. | Admin authentication exists. |
| 69 | Admin System | AdminController | `createBackup` | UT-AD-08 | `createBackup` | Trigger system backup workflow and return backup result. | Admin authentication exists and backup path or mock is prepared. |
| 70 | Admin System | AdminController | `systemRecovery` | UT-AD-09 | `systemRecovery` | Trigger system recovery flow and return recovery result. | Admin authentication exists and recovery path or mock is prepared. |
| 71 | Admin System | AdminController | `getSystemPerformance` | UT-AD-10 | `getSystemPerformance` | Return system performance indicators for the admin console. | Admin authentication exists. |

> Note: This full-system list is for breadth of coverage. The detailed coverage-control table in section `2.2` still focuses on a selected representative subset of functions for deeper unit test specification.

### 2.2 Coverage Control Summary for Detailed Function Sheets

> Note: This table is only for the representative subset that already has detailed unit test sheets below. The `29/KLOC` value is kept here as an internal optional reference, not as a mandatory full-system threshold.

| Function Code | Module | Function Name | LOC | Reference TC/KLOC (Optional) | Required TC | Designed TC | Lack of TC | Link |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| UT-FE-01 | Frontend Helper | `mapGoalTypeToDisplay` | 9 | 29 | 1 | 5 | 0 | [Open](#ut-fe-01---mapgoaltypetodisplay) |
| UT-FE-02 | Frontend Helper | `calculateSuggestedGoal` | 9 | 29 | 1 | 7 | 0 | [Open](#ut-fe-02---calculatesuggestedgoal) |
| UT-FE-03 | Frontend Helper | `calculatePhaseProgress` | 7 | 29 | 1 | 5 | 0 | [Open](#ut-fe-03---calculatephaseprogress) |
| UT-SV-01 | Frontend Service | `getUserGoal` | 13 | 29 | 1 | 4 | 0 | [Open](#ut-sv-01---getusergoal-frontend-service) |
| UT-SV-02 | Frontend Service | `getTodayProgress` | 15 | 29 | 1 | 4 | 0 | [Open](#ut-sv-02---gettodayprogress) |
| UT-BE-01 | Backend Controller | `generateAIRoadmap` | 97 | 29 | 3 | 10 | 0 | [Open](#ut-be-01---generateairroadmap) |
| UT-BE-02 | Backend Controller | `checkinWeekly` | 27 | 29 | 1 | 6 | 0 | [Open](#ut-be-02---checkinweekly) |
| UT-AD-01 | Admin Controller | `getUsers` | 67 | 29 | 2 | 7 | 0 | [Open](#ut-ad-01---getusers) |
| UT-AD-02 | Admin Controller | `createUser` | 45 | 29 | 2 | 6 | 0 | [Open](#ut-ad-02---createuser) |
| UT-AD-03 | Admin Controller | `updateUser` | 45 | 29 | 2 | 6 | 0 | [Open](#ut-ad-03---updateuser) |
| UT-AD-04 | Admin Controller | `deleteUser` | 26 | 29 | 1 | 4 | 0 | [Open](#ut-ad-04---deleteuser) |
| UT-AD-05 | Admin Controller | `getChartData` | 91 | 29 | 3 | 7 | 0 | [Open](#ut-ad-05---getchartdata) |
| **Sub Total (Detailed Subset)** |  |  | **451** |  | **19** | **71** | **0** |  |

## 3. Test Report

| Item | Value |
| --- | ---: |
| Total Functions in Full-System List | 71 |
| Functions with Detailed Test Sheets | 12 |
| Total LOC of Detailed Functions | 451 |
| Reference Required Test Cases for Detailed Subset | 19 |
| Designed Test Cases for Detailed Subset | 71 |
| Lack of Test Cases in Detailed Subset | 0 |
| Designed Coverage vs Optional Reference | 373.68% |
| Normal Test Cases | 34 |
| Boundary Test Cases | 11 |
| Abnormal Test Cases | 26 |
| Executed Test Cases | 0 |
| Passed | N/A |
| Failed | N/A |

### 3.1 Summary

- The FunctionList now covers the implemented system broadly across authentication, profile, goals, meals, workouts, AI, community, subscription, and admin modules.
- Detailed unit test sheets are currently prepared for 12 representative functions with normal, boundary, and abnormal input combinations.
- The `29/KLOC` value is treated only as an optional internal reference for the detailed subset, not as a mandatory threshold for the whole report.
- Actual execution results are still pending because the project currently has no configured automated unit test framework such as Vitest/Jest/Supertest.

---

## UT-FE-01 - `mapGoalTypeToDisplay`

| Item | Value |
| --- | --- |
| Function Code | UT-FE-01 |
| Function Name | `mapGoalTypeToDisplay` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 9 |
| Test Requirement | Verify that supported goal type codes are converted to the correct UI display labels and unsupported values fall back to the default label. |
| Required TC | 1 |
| Designed TC | 5 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-FE-01-01 | Helper is callable | `type='fat_loss'` | Normal | Return `'Fat Loss / Cutting'` | Pending execution | N/E |
| UT-FE-01-02 | Helper is callable | `type='muscle_gain'` | Normal | Return `'Hypertrophy / Muscle Gain'` | Pending execution | N/E |
| UT-FE-01-03 | Helper is callable | `type='endurance'` | Normal | Return `'Endurance / Stamina'` | Pending execution | N/E |
| UT-FE-01-04 | Helper is callable | `type='maintain'` | Normal | Return `'Maintain Weight'` | Pending execution | N/E |
| UT-FE-01-05 | Helper is callable | `type='unknown_value'` | Abnormal | Return default `'General Health'` | Pending execution | N/E |

## UT-FE-02 - `calculateSuggestedGoal`

| Item | Value |
| --- | --- |
| Function Code | UT-FE-02 |
| Function Name | `calculateSuggestedGoal` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 9 |
| Test Requirement | Verify BMI-based goal suggestion for underweight, normal, overweight, boundary BMI values, and missing input values. |
| Required TC | 1 |
| Designed TC | 7 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-FE-02-01 | Helper is callable | `weight_kg=50`, `height_cm=170` | Normal | BMI `<18.5`, return `'muscle_gain'` | Pending execution | N/E |
| UT-FE-02-02 | Helper is callable | `weight_kg=65`, `height_cm=170` | Normal | BMI in normal range, return `'maintain'` | Pending execution | N/E |
| UT-FE-02-03 | Helper is callable | `weight_kg=80`, `height_cm=170` | Normal | BMI `>=25`, return `'fat_loss'` | Pending execution | N/E |
| UT-FE-02-04 | Helper is callable | `weight_kg=74`, `height_cm=200` | Boundary | BMI exactly `18.5`, return `'maintain'` | Pending execution | N/E |
| UT-FE-02-05 | Helper is callable | `weight_kg=100`, `height_cm=200` | Boundary | BMI exactly `25`, return `'fat_loss'` | Pending execution | N/E |
| UT-FE-02-06 | Helper is callable | `weight_kg=undefined`, `height_cm=170` | Abnormal | Missing weight, return default `'muscle_gain'` | Pending execution | N/E |
| UT-FE-02-07 | Helper is callable | `weight_kg=65`, `height_cm=undefined` | Abnormal | Missing height, return default `'muscle_gain'` | Pending execution | N/E |

## UT-FE-03 - `calculatePhaseProgress`

| Item | Value |
| --- | --- |
| Function Code | UT-FE-03 |
| Function Name | `calculatePhaseProgress` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 7 |
| Test Requirement | Verify that phase progress is calculated correctly based on completed micro goals, phase boundaries, and total duration limit. |
| Required TC | 1 |
| Designed TC | 5 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-FE-03-01 | `microGoals` contains 4 tasks in weeks 1..2, all `done=true`; `totalDurationWeeks=12` | `startWeek=1`, `endWeek=2` | Normal | Return `100` | Pending execution | N/E |
| UT-FE-03-02 | `microGoals` contains 4 tasks in weeks 1..2, 2 tasks done | `startWeek=1`, `endWeek=2` | Normal | Return `50` | Pending execution | N/E |
| UT-FE-03-03 | `microGoals=[]`; `totalDurationWeeks=12` | `startWeek=1`, `endWeek=4` | Abnormal | Return `0` because no tasks exist in the phase | Pending execution | N/E |
| UT-FE-03-04 | `microGoals` contains tasks up to week 12; `totalDurationWeeks=10` | `startWeek=8`, `endWeek=12` | Boundary | Only weeks `8..10` are considered by `Math.min`, progress is calculated on valid weeks only | Pending execution | N/E |
| UT-FE-03-05 | `microGoals` contains tasks inside and outside the phase | `startWeek=3`, `endWeek=5` | Boundary | Tasks outside weeks `3..5` are ignored in the percentage | Pending execution | N/E |

## UT-SV-01 - `getUserGoal` (Frontend Service)

| Item | Value |
| --- | --- |
| Function Code | UT-SV-01 |
| Function Name | `getUserGoal` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 13 |
| Test Requirement | Verify that the service sends the authenticated request, returns parsed JSON on success, and throws an error on failed HTTP responses. |
| Required TC | 1 |
| Designed TC | 4 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-SV-01-01 | Mock `localStorage.token='abc'`; mock `fetch` returns `200` with valid goal JSON | No explicit function input | Normal | `fetch` is called with `Authorization: Bearer abc`; function resolves with goal JSON | Pending execution | N/E |
| UT-SV-01-02 | Mock `localStorage.token='abc'`; mock `fetch` returns `200` with `null` JSON | No explicit function input | Boundary | Function resolves with `null` without throwing | Pending execution | N/E |
| UT-SV-01-03 | Mock `localStorage.token='abc'`; mock `fetch` returns `401` | No explicit function input | Abnormal | Function throws `Error('Failed to fetch goal')` | Pending execution | N/E |
| UT-SV-01-04 | Mock `localStorage.token` missing; mock `fetch` returns `500` | No explicit function input | Abnormal | Function throws `Error('Failed to fetch goal')` | Pending execution | N/E |

## UT-SV-02 - `getTodayProgress`

| Item | Value |
| --- | --- |
| Function Code | UT-SV-02 |
| Function Name | `getTodayProgress` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 15 |
| Test Requirement | Verify that the service requests today's progress with token header, returns JSON on success, and throws on failed responses. |
| Required TC | 1 |
| Designed TC | 4 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-SV-02-01 | Mock `localStorage.token='abc'`; mock `fetch` returns `200` with progress JSON | No explicit function input | Normal | Function resolves with progress JSON | Pending execution | N/E |
| UT-SV-02-02 | Mock `fetch` returns `200` with empty/default progress payload | No explicit function input | Boundary | Function resolves with the returned payload | Pending execution | N/E |
| UT-SV-02-03 | Mock `fetch` returns `401` | No explicit function input | Abnormal | Function throws `Error('Failed to fetch today progress')` | Pending execution | N/E |
| UT-SV-02-04 | Mock `fetch` returns `500` | No explicit function input | Abnormal | Function throws `Error('Failed to fetch today progress')` | Pending execution | N/E |

## UT-BE-01 - `generateAIRoadmap`

| Item | Value |
| --- | --- |
| Function Code | UT-BE-01 |
| Function Name | `generateAIRoadmap` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 97 |
| Test Requirement | Verify request validation, user existence checking, AI response parsing, archival of old goals, creation of new goal/micro goals, and server error handling. |
| Required TC | 3 |
| Designed TC | 10 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-BE-01-01 | Mock `req.user.id` valid | `duration_weeks=0` and other fields valid | Abnormal | Respond `400` with message `Duration must be between 1 and 52 weeks.` | Pending execution | N/E |
| UT-BE-01-02 | Mock `req.user.id` valid | `duration_weeks=53` and other fields valid | Abnormal | Respond `400` with the same duration validation message | Pending execution | N/E |
| UT-BE-01-03 | Mock `req.user.id` valid | `commitment_days_per_week=0` and other fields valid | Abnormal | Respond `400` with message `Commitment days must be between 1 and 7.` | Pending execution | N/E |
| UT-BE-01-04 | Mock `req.user.id` valid | `target_weight=301` and other fields valid | Abnormal | Respond `400` with message `Target weight must be between 20kg and 300kg.` | Pending execution | N/E |
| UT-BE-01-05 | Mock `User.findById` returns `null` | Valid request body | Abnormal | Respond `404` with message `User not found` | Pending execution | N/E |
| UT-BE-01-06 | Mock Gemini returns invalid JSON text | Valid request body and existing user | Abnormal | `JSON.parse` path fails; respond `500` with message `Failed to generate AI roadmap` | Pending execution | N/E |
| UT-BE-01-07 | Mock existing active goals; Gemini returns valid phases and microGoals | Valid request body | Normal | Old active goals are archived, new goal is created, micro goals inserted, respond `201` | Pending execution | N/E |
| UT-BE-01-08 | Mock no active goals; Gemini returns valid phases and microGoals | Valid request body | Normal | New goal and micro goals are created, respond `201` | Pending execution | N/E |
| UT-BE-01-09 | Mock existing user; Gemini returns valid JSON | `duration_weeks=1` and other fields valid | Boundary | Validation passes and function responds `201` | Pending execution | N/E |
| UT-BE-01-10 | Mock existing user; Gemini returns valid JSON | `commitment_days_per_week=7` and other fields valid | Boundary | Validation passes and function responds `201` | Pending execution | N/E |

## UT-BE-02 - `checkinWeekly`

| Item | Value |
| --- | --- |
| Function Code | UT-BE-02 |
| Function Name | `checkinWeekly` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 27 |
| Test Requirement | Verify weekly check-in validation, update of existing weekly log, insertion of new weekly log, and not-found handling. |
| Required TC | 1 |
| Designed TC | 6 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-BE-02-01 | Mock valid goal record | Missing `week` or missing `weight` | Abnormal | Respond `400` with message `Week and Weight are required.` | Pending execution | N/E |
| UT-BE-02-02 | Mock valid goal record | `weight=19` | Abnormal | Respond `400` with message `Invalid weight submitted.` | Pending execution | N/E |
| UT-BE-02-03 | Mock `Goal.findById` returns `null` | Valid `week`, `weight`, `feeling` | Abnormal | Respond `404` with message `Goal not found` | Pending execution | N/E |
| UT-BE-02-04 | Mock goal with existing log for week 2 | `week=2`, `weight=69.5`, `feeling='great'` | Normal | Existing `weekly_log` entry is updated and response is `200` | Pending execution | N/E |
| UT-BE-02-05 | Mock goal without log for week 3 | `week=3`, `weight=68`, `feeling='normal'` | Normal | New log is appended and response is `200` | Pending execution | N/E |
| UT-BE-02-06 | Mock valid goal | `week=4`, `weight=300`, `feeling='normal'` | Boundary | Boundary weight is accepted and response is `200` | Pending execution | N/E |

## UT-AD-01 - `getUsers`

| Item | Value |
| --- | --- |
| Function Code | UT-AD-01 |
| Function Name | `getUsers` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 67 |
| Test Requirement | Verify pagination defaults, filter building, user formatting, and error handling for the admin user list API. |
| Required TC | 2 |
| Designed TC | 7 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-AD-01-01 | Mock `User.find` and `User.countDocuments` success | `page=1`, `limit=10`, no search/role/status | Normal | Return formatted user list and pagination object | Pending execution | N/E |
| UT-AD-01-02 | Mock DB success | `search='nam'` | Normal | Query contains `$or` regex filters for `profile.full_name` and `email` | Pending execution | N/E |
| UT-AD-01-03 | Mock DB success | `role='admin'` | Normal | Query contains `role='admin'` | Pending execution | N/E |
| UT-AD-01-04 | Mock DB success | `status='active'` | Normal | Query contains `status='active'` | Pending execution | N/E |
| UT-AD-01-05 | Mock DB success | `search='a'`, `role='user'`, `status='inactive'` | Normal | Query combines all selected filters correctly | Pending execution | N/E |
| UT-AD-01-06 | Mock DB success | `page='abc'`, `limit='xyz'` | Boundary | `parseInt` fallback is used, page becomes `1`, limit becomes `10` | Pending execution | N/E |
| UT-AD-01-07 | Mock `User.find` throws error | Any request query | Abnormal | Respond `500` with server error message | Pending execution | N/E |

## UT-AD-02 - `createUser`

| Item | Value |
| --- | --- |
| Function Code | UT-AD-02 |
| Function Name | `createUser` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 45 |
| Test Requirement | Verify duplicate email handling, password hashing, default role/status values, profile defaults, and server error handling during admin user creation. |
| Required TC | 2 |
| Designed TC | 6 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-AD-02-01 | Mock `User.findOne` returns `null`; mock bcrypt and `save` success | Valid `email`, `password`, `role`, `status`, and `profile` | Normal | Respond `201`; returned user excludes `password_hash` | Pending execution | N/E |
| UT-AD-02-02 | Mock `User.findOne` returns `null`; omit `role` and `status` | Valid `email`, `password`, `profile.full_name` | Normal | New user is created with default `role='user'` and `status='active'` | Pending execution | N/E |
| UT-AD-02-03 | Mock `User.findOne` returns `null`; omit `phone_number` and `address` | Valid required fields only | Normal | Profile defaults `phone_number=''` and `address=''` | Pending execution | N/E |
| UT-AD-02-04 | Mock bcrypt success | Valid body | Normal | Stored `password_hash` is generated by bcrypt and is different from raw password | Pending execution | N/E |
| UT-AD-02-05 | Mock `User.findOne` returns existing user | Duplicate `email` | Abnormal | Respond `400` with message `Email already exists` | Pending execution | N/E |
| UT-AD-02-06 | Mock `save` throws error | Valid body | Abnormal | Respond `500` with server error message | Pending execution | N/E |

## UT-AD-03 - `updateUser`

| Item | Value |
| --- | --- |
| Function Code | UT-AD-03 |
| Function Name | `updateUser` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 45 |
| Test Requirement | Verify not-found handling, update of role/status/profile, optional password hashing, profile merge behavior, and error handling. |
| Required TC | 2 |
| Designed TC | 6 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-AD-03-01 | Mock existing user and `save` success | `role`, `status`, and `profile` provided | Normal | User fields are updated and response is `200` without `password_hash` | Pending execution | N/E |
| UT-AD-03-02 | Mock existing user and bcrypt success | `password='newPass123'` | Normal | `password_hash` is regenerated before save | Pending execution | N/E |
| UT-AD-03-03 | Mock existing user | `password` omitted | Normal | Password hash remains unchanged | Pending execution | N/E |
| UT-AD-03-04 | Mock existing user with full profile | Partial `profile={ address: 'New address' }` | Normal | Existing profile fields are merged, not replaced with blanks | Pending execution | N/E |
| UT-AD-03-05 | Mock `User.findById` returns `null` | Valid update body | Abnormal | Respond `404` with message `User not found` | Pending execution | N/E |
| UT-AD-03-06 | Mock `save` throws error | Valid update body | Abnormal | Respond `500` with server error message | Pending execution | N/E |

## UT-AD-04 - `deleteUser`

| Item | Value |
| --- | --- |
| Function Code | UT-AD-04 |
| Function Name | `deleteUser` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 26 |
| Test Requirement | Verify existence check, deletion of related workout logs, deletion of the user record, and error handling. |
| Required TC | 1 |
| Designed TC | 4 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-AD-04-01 | Mock existing user and successful delete operations | Valid `req.params.id` | Normal | Delete workout logs, delete user, respond `200` with success message | Pending execution | N/E |
| UT-AD-04-02 | Mock existing user; `WorkoutLog.deleteMany` deletes `0` documents | Valid `req.params.id` | Normal | User deletion still succeeds and response is `200` | Pending execution | N/E |
| UT-AD-04-03 | Mock `User.findById` returns `null` | Valid `req.params.id` | Abnormal | Respond `404` with message `User not found` | Pending execution | N/E |
| UT-AD-04-04 | Mock `WorkoutLog.deleteMany` or `User.findByIdAndDelete` throws error | Valid `req.params.id` | Abnormal | Respond `500` with server error message | Pending execution | N/E |

## UT-AD-05 - `getChartData`

| Item | Value |
| --- | --- |
| Function Code | UT-AD-05 |
| Function Name | `getChartData` |
| Created By | Project Team Draft |
| Executed By | Pending |
| Lines of Code | 91 |
| Test Requirement | Verify period selection, default behavior, zero-fill logic for missing periods, preservation of aggregated counts, and error handling. |
| Required TC | 3 |
| Designed TC | 7 |
| Lack of TC | 0 |

| TC ID | Preconditions | Input Values | Type | Confirmation / Expected Result | Actual Result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UT-AD-05-01 | Mock `User.aggregate` returns some monthly data | `req.query.period` omitted | Normal | Period defaults to `'month'`; response contains `12` month buckets | Pending execution | N/E |
| UT-AD-05-02 | Mock `User.aggregate` returns some daily data | `period='day'` | Normal | Response contains `30` day buckets | Pending execution | N/E |
| UT-AD-05-03 | Mock `User.aggregate` returns some weekly data | `period='week'` | Normal | Response contains `12` week buckets | Pending execution | N/E |
| UT-AD-05-04 | Mock aggregate data containing selected periods with counts | `period='month'` | Normal | Returned `filledData` preserves the original counts for matching periods | Pending execution | N/E |
| UT-AD-05-05 | Mock aggregate returns sparse data only for a few periods | `period='month'` | Boundary | Missing periods are still returned with `count=0` | Pending execution | N/E |
| UT-AD-05-06 | Mock `User.aggregate` returns data; input `period='year'` | `period='year'` | Abnormal | Function falls back to `'month'` behavior | Pending execution | N/E |
| UT-AD-05-07 | Mock `User.aggregate` throws error | Any request query | Abnormal | Respond `500` with server error message | Pending execution | N/E |

## 4. Remarks

- This report is sufficient as a draft unit test report/specification for submission or for transferring into the customer's Excel template.
- If you want the report to become an executable unit test package, the next step should be adding:
  - `Vitest` for frontend helper/service tests
  - `Jest` or `Vitest` + `Supertest` for backend controller tests
  - model and API mocking strategy for Mongoose and Gemini
