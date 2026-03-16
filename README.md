## ☀️ SolYield Technician App – Level 1
Technician Schedule & Reporting Module

Level 1 delivers the foundational “Technician Schedule & Reporting” system for SolYield.

The primary objective is to provide technicians (Arjun) with:

A unified task schedule

Verified on-site reporting

Seamless navigation to solar sites

Compliance-ready PDF documentation

## 🚀 Features Completed
## 📅 1.1 Google Calendar Sync & My Visits
🔹 Account-First Synchronization

Visits sync directly to the technician’s Google Calendar account (if available).

🔹 Intelligent Fallback

If Google Calendar is unavailable:

The system automatically defaults to the Android Local Calendar

Ensures no visit data is lost

🔹 Unified Schedule View

“My Visits” screen displays all assigned work orders

One-touch Sync to Device functionality

🔹 Bonus Feature

Open any visit directly inside the native Calendar app

📍 1.2 Geolocation-Verified Check-In
🔹 Live Proximity Tracking

Integrated expo-location for real-time technician positioning.

🔹 The 500m Rule (Fraud Prevention Logic)

Check-In button remains locked

Uses the Haversine Formula to compute real-world distance

Activates only when technician is within 500 meters of the solar site

✅ Prevents fraudulent remote check-ins
✅ Ensures on-site compliance

## 🗺️ 1.3 Mapping & Navigation
🔹 Site Geolocation

Integrated react-native-maps to display solar park locations.

🔹 Interactive Site Pins

Tapping a pin reveals a Callout bubble with:

Site name

Capacity / details

🔹 One-Touch Navigation

Selecting a site:

Launches Google Maps

Injects site latitude & longitude

Automatically begins turn-by-turn navigation

Routes from technician’s current location

Designed specifically for remote desert deployment scenarios.

## 📊 1.4 Automated PDF Report Generation
🔹 Structured Report Engine

Used expo-print to convert visit responses into compliance-ready PDFs.

🔹 Dynamic Chart Rendering

Bar Chart → Daily Generation (from chart_data.json)

Pie Chart → Performance Breakdown (from performance_data.json)

🔹 Technical Implementation

Because PDFs are static:

Charts are rendered using react-native-gifted-charts

Captured as high-resolution images using react-native-view-shot

Converted to Base64 via expo-file-system

Injected into an HTML template

Generated into a downloadable PDF

📄 Result: Professional, data-rich reports ready for submission.

## 🧠 Core Technical Concepts Implemented

Distance calculation using Haversine Formula

Deep linking to external navigation apps

Native calendar integration with account detection

Image capture and Base64 embedding for static document rendering

Dynamic form data injection into PDF templates

## 🛠 Tech Stack
Framework

🔹React Native (Expo SDK 54)

Navigation

🔹Expo Router

Mapping & Location

🔹react-native-maps

🔹expo-location

Calendar Integration

🔹expo-calendar

Reporting & Document Generation

🔹expo-print

🔹expo-sharing

Charts & Visualization

🔹react-native-gifted-charts

Media & File Handling

🔹react-native-view-shot

🔹expo-file-system

## 🎥 Demo Video

Watch the full Level 1 walkthrough here:
👉 [View Demo (Google Drive)](https://drive.google.com/file/d/15_KgWBxsfFIWrjBYr-XGDE9A-_qbQMIM/view?usp=drive_link)

---

## 📸 Application Screens

Screenshots available here:
👉 [View Screenshots]
Visits:(https://drive.google.com/file/d/1Vk99em7mvIzz3huv-3JIWSW2d4mLYPNY/view?usp=drive_link)
Check-in:(https://drive.google.com/file/d/1UwM2f-ch00b0EvNmZ5Jor-3eeQiMQthX/view?usp=drive_link)
Form:(https://drive.google.com/file/d/1KMfU5MZRrVXQBoZLA8tMeDpy7z1T0t9p/view?usp=drive_link)
Report Review 1:(https://drive.google.com/file/d/1gFhazHhgoy-XJgKq4HVuCIIyl8HFC2e3/view?usp=drive_link)
Report Review 2:(https://drive.google.com/file/d/1L0mD2NjqLORhy7espfCaa9xONIHVJc4c/view?usp=drive_link)
Map:(https://drive.google.com/file/d/1u3c-hoBFIzna-CJb4Wot30P4CTdIdWBl/view?usp=drive_link)


## ☀️ SolYield Technician App – Level 2
## Advanced Offline Synchronization & Persistence Module
Level 2 upgrades SolYield from a live-dependent app to a robust Offline-First platform. The system is now designed to handle high-stakes reporting in remote areas with zero connectivity, ensuring Arjun never loses a single byte of data or a high-resolution photo.

The primary objective is to provide:

Persistent Local Storage using a reactive database.

Background Sync Service with multi-part data handling.

Mock API Integration via Beeceptor for end-to-end verification.

Intelligent Conflict Resolution to protect data integrity.

## 🚀 Features Completed
## 💾 2.1 Reactive Offline Database (WatermelonDB)
🔹 SQL-Based Persistence Implemented WatermelonDB with an underlying SQLite engine for high-performance, persistent data storage.

🔹 Hardened Data Persistence (Restart Resilient) * Persistence Across App Restarts: Unlike state-only apps, all form progress is written to the SQLite disk. If the app is force-closed mid-inspection, all data and photos are instantly restored upon relaunch.

Atomic Transactions: Ensures that app crashes during a "Save" won't result in database corruption.
🔹 State Reactivity The UI automatically reflects database changes without manual refreshes.

## 🔄 2.2 Resilient Sync Service & Beeceptor Integration
🔹 Mock Server Orchestration Integrated Beeceptor to simulate a production REST API for full HTTP lifecycle testing (200 OK and 409 Conflict handling).

🔹 Multipart Reconstruction Logic * Physical Fetch: The service uses stored URIs to grab actual binary files from the device disk.

FormData Assembly: Dynamically constructs Multipart/Form-Data requests, attaching binaries alongside JSON metadata for a single-trip submission.
🔹 🏆 Bonus: Intelligent Conflict Handling Prevents "Stale Data Overwrites" using last_modified timestamps. If the server returns a 409 Conflict, the app flags the record to ensure team-wide data consistency.

## 📸 2.3 Advanced Media Handling & URI Storage
🔹 Automated Image Optimization Integrated expo-image-manipulator to scale and compress photos, reducing bandwidth usage by up to 80% while maintaining technical clarity.
🔹 Smart URI Persistence * Storage Logic: Instead of bloating the DB with Base64 strings, the app stores the Absolute File URI (e.g., file:///.../photo.jpg).

Performance Optimization: Using file pointers ensures the app remains fast and responsive, even with hundreds of inspection photos stored locally.

## 🎨 2.4 UI/UX Considerations for Remote Work
🔹 Technician-Centric Design (TX)

High-Contrast "Large Button" UI: All primary actions (Check-In, Add Photo, Submit) utilize large-format, full-width buttons to ensure easy interaction even while wearing work gloves or in high-glare environments.

Sync Banners: Contextual color-coded banners (Yellow/Green) indicate whether a report is "Local Only" or "Cloud Secured."

Optimistic UI Updates: Changes are reflected in the UI immediately upon saving to the local database, providing a "no-lag" experience regardless of network speed.

## 🧠 Core Technical Concepts Implemented
Offline-First Architecture: Local-first writes with secondary cloud synchronization.

Restart-Resilient State: Decoupling app state from volatile memory to persistent SQLite storage.

Multipart Binary Handling: Reconstructing physical files from stored DB paths for HTTP transmission.

Ergonomic Field UI: Large-target touch surfaces and visual cues for background processes.

## 🛠 Tech Stack Update
Database: WatermelonDB (Reactive SQLite)

Networking: Beeceptor (Mocking), Native Fetch (Multipart)

Media: expo-image-manipulator, expo-file-system
Gemini said
That is a great addition for the 2.4 UI/UX section. In the field, technicians like Arjun are often wearing gloves or moving quickly, so "Fat Finger Friendly" design—using high-contrast, large-format buttons—is a professional necessity, not just a stylistic choice.

## 🎥 Demo Video (Level 2)
👉 [View Level 2 Demo (Google Drive)]
https://drive.google.com/file/d/1i39gb-P6GGe6erttGM8g52yvZ2YGJ4R4/view?usp=sharing

📸 Application Screens (Level 2 Updates)
👉 [View Screenshots]
1.Technician Dashboard
https://drive.google.com/file/d/1bLgC40qsEI96ydGJCwhwsLBZ05y_nSyT/view?usp=drive_link
2. Visit Details & Site Check-In
https://drive.google.com/file/d/1zsg7OimUCwjP_sIaBjjdFdgRV7376-Gk/view?usp=drive_link
3. Local Draft Saving
https://drive.google.com/file/d/17YfA5kYo9Q1VNC_2y6ElbDuJzdbnbpeY/view?usp=drive_link
4. Successful Inspection Submission
https://drive.google.com/file/d/1LsXHAKU7Ipx9Ckd-Upm2B4J9ja-QSs5M/view?usp=drive_link
5. Offline Technician Dashboard
https://drive.google.com/file/d/1RB5nVpnFPS6iLmcf2NfmY2qS7uh2wo0x/view?usp=drive_link
6. Local Draft Management
https://drive.google.com/file/d/1kcrSk01aDTQA8Akn91PJxTtA1moz8Ijd/view?usp=drive_link
7. Offline Inspection Save
https://drive.google.com/file/d/1KrNMcCZKMeHqP_eP2lSCL7chRKfgoMza/view?usp=drive_link
8. Offline Draft Queue
https://drive.google.com/file/d/1YKz1oNE9WWTMB3ZMGRv02vPIa5fhGNHk/view?usp=drive_link
9. Automatic Sync After Connection Restore
https://drive.google.com/file/d/1BYZ965Ka6bu63LuyfkkhepJFCdFiF4tN/view?usp=drive_link
10. Manual Sync Option
https://drive.google.com/file/d/1qPW9bwtLgkuxwPGiF8JUs5iuXSe62PcR/view?usp=drive_link
11. Updated Dashboard After Sync
https://drive.google.com/file/d/1IcMO67G6pKmH6LhaHqhz-c3DRAsYFCYU/view?usp=drive_link
12. Backend API Request (Inspection Submission)
https://drive.google.com/file/d/1Pvgs9DVATCWsBwuV6zLcClMLGvdxAHDY/view?usp=drive_link

