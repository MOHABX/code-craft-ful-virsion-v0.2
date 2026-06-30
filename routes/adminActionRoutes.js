const express = require('express');
const router = express.Router();
const { blockDevice, unblockDevice, forceLogout } = require('../adminActionController');

// هذه المسارات يتم الوصول إليها مباشرة عبر روابط البريد الإلكتروني، لذا تستخدم GET بدلاً من POST/PUT
// تتم المصادقة عبر رمز JWT في معامل الرابط

// يا خوي هذي تفتح درب للمراسيل في السيرفر، نستقبل الطلب ونقضي اللزوم
router.get('/block/:token', blockDevice);
// يا خوي هذي تفتح درب للمراسيل في السيرفر، نستقبل الطلب ونقضي اللزوم
router.get('/unblock/:token', unblockDevice);
// يا خوي هذي تفتح درب للمراسيل في السيرفر، نستقبل الطلب ونقضي اللزوم
router.get('/logout/:token', forceLogout);

module.exports = router;
