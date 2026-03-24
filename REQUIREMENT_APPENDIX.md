# 5. Requirement Appendix

## 5.1 Business Rules

Table III.36: Description rule definition of the system

| ID | Rule Definition |
|---|---|
| BR-01 | A new account shall be created in the database when a guest successfully registers with valid information. |
| BR-02 | A new account may also be created automatically when a guest logs in through Google for the first time and no matching account exists. |
| BR-03 | Each account shall use a unique email address. |
| BR-04 | Email addresses shall follow a valid email format before they are accepted by the system. |
| BR-05 | Passwords shall not be stored in plain text and must be protected using secure hashing. |
| BR-06 | A banned account shall not be allowed to log into the system. |
| BR-07 | Only authenticated users may access protected features of the system. |
| BR-08 | Invalid, expired, or missing authentication tokens shall not grant access to restricted screens or APIs. |
| BR-09 | Role-based access control shall distinguish at least Guest, User, and Admin roles. |
| BR-10 | Only administrators may access administrative modules and privileged management operations. |
| BR-11 | A newly authenticated user with incomplete physical information shall be redirected to onboarding before using personalized features. |
| BR-12 | The user profile shall contain valid personal and health-related information before advanced personalized functions are applied. |
| BR-13 | Height and weight values shall be numeric, positive, and within a reasonable range before being stored. |
| BR-14 | Users may only update or manage their own profile unless an administrator is explicitly allowed to act on their behalf. |
| BR-15 | BMI and related health indicators shall be calculated from the latest available body metrics. |
| BR-16 | User profile information shall be reused across meal planning, workout recommendations, goal tracking, and AI coaching. |
| BR-17 | A user may have only one active detailed fitness goal at a time. |
| BR-18 | When a new AI roadmap is accepted, the previously active goal shall be archived automatically. |
| BR-19 | A fitness goal must include a valid goal type and a valid duration before roadmap generation can proceed. |
| BR-20 | AI-generated roadmap content shall be based on the authenticated user's profile and submitted goal information. |
| BR-21 | Micro goals shall always belong to a specific parent goal. |
| BR-22 | Micro goals shall be tracked by completion status for progress calculation. |
| BR-23 | Goal progress shall be calculated from the proportion of completed micro goals to total micro goals. |
| BR-24 | Weekly check-in data must include at least the week number and current weight. |
| BR-25 | If a check-in already exists for the same week, the system shall update that record instead of creating a duplicate. |
| BR-26 | Goal analytics such as weight charts and phase progress shall reflect the latest saved check-in and micro-goal data. |
| BR-27 | Food items shall contain enough nutritional information to support calorie and macro-based meal planning. |
| BR-28 | Food catalog data shall be available for search, browsing, and meal-plan selection. |
| BR-29 | Meal plans shall be stored per user and per date. |
| BR-30 | Meal item quantities shall be validated before totals are recalculated and saved. |
| BR-31 | Adding, updating, or deleting a meal item shall immediately affect the total calories of the corresponding meal plan. |
| BR-32 | Users may only access and manage their own meal plans unless an administrator is performing a permitted management action. |
| BR-33 | Administrative meal-plan assistance shall target a selected user and date context. |
| BR-34 | AI nutrition suggestions shall be based on the latest available user profile and meal-plan context where applicable. |
| BR-35 | Workout records shall contain sufficient information for listing, filtering, detail display, and calorie-related use cases. |
| BR-36 | Workouts may be filtered by category, level, and search keyword. |
| BR-37 | A user shall not add the same unfinished workout to the personal workout list more than once. |
| BR-38 | Starting a workout shall change its status to `in_progress`. |
| BR-39 | Finishing a workout shall create a workout log and mark the related user-workout item as `completed`. |
| BR-40 | Calories burned for a completed workout shall be calculated using duration, MET value, and user body weight. |
| BR-41 | Workout logs shall belong to the authenticated user and support later progress analysis. |
| BR-42 | Custom workout creation shall support multiple exercises with title, video URL, duration, and ordering information. |
| BR-43 | Workout detail pages shall display the exercises associated with the selected workout. |
| BR-44 | Workout categories shall be maintained as identifiable records so that workouts can be organized consistently. |
| BR-45 | Progress summaries such as daily activity, streaks, and weekly overview shall be derived from stored workout and goal-related data. |
| BR-46 | Body-progress-related analytics shall always use the latest valid stored or submitted user data available to that feature. |
| BR-47 | If no progress data exists yet, the system shall display an empty or zero state rather than invalid values. |
| BR-48 | AI Coach shall only use data that belongs to the requesting user or is otherwise permitted in the active context. |
| BR-49 | AI suggestions shall be based on the latest available system data whenever such data exists. |
| BR-50 | Empty AI chat messages shall not be submitted for processing. |
| BR-51 | AI workout recommendations shall only select from workouts that already exist in the system library. |
| BR-52 | Community posts shall be displayed in reverse chronological order, with the most recent content first. |
| BR-53 | Only authenticated users may create posts, like posts, save posts, comment, create groups, or join and leave groups. |
| BR-54 | Public viewers may access only the community content exposed by the current implementation and may not perform restricted interactions. |
| BR-55 | Likes and saved-post states shall be tracked per user. |
| BR-56 | Comments shall remain associated with both the related post and the commenting user. |
| BR-57 | Group creators shall automatically become both the administrator and the first member of that group. |
| BR-58 | Group membership toggling shall support both join and leave behavior for the authenticated user. |
| BR-59 | Leaderboard ranking shall be based on tracked user activity data. |
| BR-60 | Only users with measurable activity data should appear in leaderboard results. |
| BR-61 | User-management functions shall only be available to administrators. |
| BR-62 | Administrators may search, filter, create, update, and delete user accounts through the management module. |
| BR-63 | When deleting an account, the system shall also remove or detach dependent records according to the implemented backend logic. |
| BR-64 | Food-catalog management functions such as create, edit, and delete shall only be available to administrators. |
| BR-65 | Workout-template management for system-wide records should be treated as an administrative responsibility. |
| BR-66 | Administrative dashboard statistics shall be derived from live or currently stored database data whenever available. |
| BR-67 | Administrative chart data shall support period-based aggregation such as day, week, or month. |
| BR-68 | Administrative maintenance features such as backup and recovery shall be restricted to authorized administrators. |
| BR-69 | Sensitive personal data including profile details, body metrics, meal plans, goals, and workout logs shall be protected from unauthorized access. |
| BR-70 | Unauthorized modification, deletion, or tampering of user-owned or admin-owned data shall be prevented through authentication and authorization checks. |
| BR-71 | Error responses such as unauthorized, forbidden, not found, and server error shall be used appropriately when business rules are violated or operations fail. |
| BR-72 | Empty-state, fallback, or partial-data behavior should be used when optional records do not yet exist, instead of allowing the interface to break. |
| BR-73 | Real-time community updates should synchronize newly created or updated posts to connected clients through the implemented socket mechanism. |
| BR-74 | Legacy or prototype modules that depend on unavailable backend routes shall not be treated as fully operational production features without corresponding backend support. |
| BR-75 | Where administrative actions such as account moderation, backup, recovery, or deletion are performed, the system should preserve traceability through logs or recorded action history if such logging is implemented. |

## Notes

- This appendix is written for the HealthMate project domain, including authentication, onboarding, fitness goals, workouts, meal planning, AI support, community interaction, and administration.
- The number of business rules is not fixed artificially; it is chosen to cover the system as completely as practical from the current codebase and documented behavior.
- The rules are written at business level so they can support the use cases, screen descriptions, and non-functional requirements already prepared for the project.
