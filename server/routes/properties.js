const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Get all properties (return ALL for dev/demo purposes)
router.get('/', async (req, res) => {
  try {
    // For demo purposes, returning all properties regardless of status
    // In production, this should be: { status: 'approved' }
    const properties = await Property.find(); 
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get MY properties (all statuses)
router.get('/my', auth, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id }).populate(
      'tenant',
      'name email phone address aadhar gender age dateOfBirth familyMembers religion occupation companyName monthlyIncome maritalStatus idType idNumber idProofImage'
    );
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add Property
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      propertyType,
      location,
      price,
      transactionType,
      images,
      geoLocation,
      totalArea,
      bedrooms,
      facing
    } = req.body;
    
    const newProperty = new Property({
      title,
      propertyType,
      location,
      price,
      transactionType,
      totalArea,
      bedrooms,
      facing,
      images,
      geoLocation,
      owner: req.user.id,
      status: 'approved' // Auto-approve for demo purposes
    });

    const property = await newProperty.save();
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Property
router.put('/:id', auth, async (req, res) => {
  try {
    const propertyId = req.params.id;
    console.log(`[DEBUG] PUT /api/properties/${propertyId} - Start`);
    console.log(`[DEBUG] User ID from token: ${req.user.id}`);
    
    // Validate ID format
    if (!propertyId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`[DEBUG] Invalid Property ID format: ${propertyId}`);
        return res.status(400).json({ msg: 'Invalid Property ID' });
    }

    const {
      title,
      propertyType,
      location,
      price,
      transactionType,
      images,
      geoLocation,
      totalArea,
      bedrooms,
      facing,
      status
    } = req.body;

    // Build property object
    const propertyFields = {};
    if (title) propertyFields.title = title;
    if (propertyType) propertyFields.propertyType = propertyType;
    if (location) propertyFields.location = location;
    if (price) propertyFields.price = price;
    if (transactionType) propertyFields.transactionType = transactionType;
    if (images) propertyFields.images = images;
    if (geoLocation) propertyFields.geoLocation = geoLocation;
    if (totalArea) propertyFields.totalArea = totalArea;
    if (bedrooms) propertyFields.bedrooms = bedrooms;
    if (facing) propertyFields.facing = facing;
    if (status) propertyFields.status = status;

    let property = await Property.findById(req.params.id);
    console.log(`[DEBUG] Property search for ID: ${req.params.id}`);

    if (!property) {
      console.log(`[DEBUG] Property not found!`);
      return res.status(404).json({ msg: 'Property not found' });
    }
    console.log(`[DEBUG] Property found: ${property._id}`);

    // Make sure user owns property
    if (property.owner.toString() !== req.user.id) {
      console.log(`[DEBUG] Authorization failed. Owner: ${property.owner}, User: ${req.user.id}`);
      return res.status(401).json({ msg: 'Not authorized' });
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: propertyFields },
      { new: true }
    );

    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete Property
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) return res.status(404).json({ msg: 'Property not found' });

    // Make sure user owns property
    if (property.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Property removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
