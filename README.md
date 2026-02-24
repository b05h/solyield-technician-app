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
