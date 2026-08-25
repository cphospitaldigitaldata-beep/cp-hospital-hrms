// Role-Based Access Control Middleware
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        // उदाहरण के लिए, हम यहाँ यूजर का रोल हेडर या यूजर ऑब्जेक्ट से चेक करते हैं
        const userRole = req.headers['x-user-role'] || 'Guest';

        if (allowedRoles.includes(userRole)) {
            // यदि यूजर अधिकृत है, तो आगे बढ़ने दें और ऑडिट लॉग रिकॉर्ड करें
            console.log(`[AUDIT LOG] Role: ${userRole} accessed path: ${req.originalUrl} at ${new Date().toISOString()}`);
            next();
        } else {
            res.status(403).json({
                success: false,
                error: `Access Denied! Role '${userRole}' is not authorized to access this resource.`
            });
        }
    };
};

module.exports = verifyRole;