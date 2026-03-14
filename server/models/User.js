const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // For MERN simple auth
  name: { type: String, required: true },
  tamilRole: {
    type: String,
    enum: ['superAdmin', 'owners', 'brokersBuilders', 'customers'],
    default: 'customers'
  },
  approved: { type: Boolean, default: true },
  role: { type: String, default: 'user' }, // internal role (admin/user)
  phone: { type: String },
  address: { type: String },
  aadhar: { type: String },
  gender: { type: String },
  age: { type: Number },
  dateOfBirth: { type: Date },
  familyMembers: { type: Number },
  religion: { type: String },
  occupation: { type: String },
  companyName: { type: String },
  monthlyIncome: { type: Number },
  maritalStatus: { type: String },
  idType: { type: String },
  idNumber: { type: String },
  idProofImage: { type: String },
  notificationsEnabled: { type: Boolean, default: true },
  profileCompletion: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  otpPurpose: { type: String },
  otpAttempts: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
