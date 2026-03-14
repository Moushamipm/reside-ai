const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users (Admin only - simplified for now)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Approve user
router.put('/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.approved = true;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      aadhar,
      gender,
      age,
      dateOfBirth,
      familyMembers,
      religion,
      occupation,
      companyName,
      monthlyIncome,
      maritalStatus,
      idType,
      idNumber,
      idProofImage,
      notificationsEnabled
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (aadhar) user.aadhar = aadhar;
    if (gender) user.gender = gender;
    // Optional tenant/owner profile fields
    if (age !== undefined) user.age = age;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (familyMembers !== undefined) user.familyMembers = familyMembers;
    if (religion) user.religion = religion;
    if (occupation) user.occupation = occupation;
    if (companyName) user.companyName = companyName;
    if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
    if (maritalStatus) user.maritalStatus = maritalStatus;
    if (idType) user.idType = idType;
    if (idNumber) user.idNumber = idNumber;
    if (idProofImage) user.idProofImage = idProofImage;
    if (notificationsEnabled !== undefined) {
      if (typeof notificationsEnabled === 'boolean') {
        user.notificationsEnabled = notificationsEnabled;
      } else if (typeof notificationsEnabled === 'string') {
        user.notificationsEnabled = notificationsEnabled === 'true' || notificationsEnabled === 'on';
      }
    }

    const completionFields = [
      user.name,
      user.phone,
      user.address,
      user.dateOfBirth,
      user.gender,
      user.occupation,
      user.companyName,
      user.monthlyIncome,
      user.familyMembers,
      user.maritalStatus,
      user.aadhar || user.idNumber,
      user.idType,
      user.religion,
      user.age
    ];
    const totalFields = completionFields.length;
    const filledFields = completionFields.filter((value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    }).length;
    const completionPercent = Math.round((filledFields / totalFields) * 100);
    user.profileCompletion = completionPercent;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
