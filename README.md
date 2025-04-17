# HR System for Construction Company

## Adding Super Admin User

To add the super admin user (Ahmed Gendy), follow these steps:

1. Make sure you have Node.js installed
2. Run the following command in your terminal:

\`\`\`bash
node scripts/add-super-admin.js
\`\`\`

This will create a user with the following details:
- Email: ah.tarek@edecs.com
- Name: Ahmed Gendy
- Password: hawwwe9zA@
- Department: Business Applications
- Role: Super Admin

## Performance Optimizations

This application includes several performance optimizations:

1. **Data Caching**: Frequently accessed data is cached to reduce database reads
2. **Optimized Auth Context**: The authentication context has been optimized to reduce re-renders
3. **Debounce and Memoization**: Utility functions for limiting expensive operations
4. **Batch Operations**: Database operations are batched to reduce network calls
5. **Optimized Firebase Data Hook**: Custom hook for efficient data fetching

## Firebase Database Rules

For proper security, ensure your Firebase Realtime Database rules are set up correctly:

\`\`\`json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'super admin' || root.child('users').child(auth.uid).child('role').val() === 'admin')"
      }
    },
    "system": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'super admin' || root.child('users').child(auth.uid).child('role').val() === 'admin')"
    },
    // Add rules for other collections as needed
  }
}
