/**
 * Comprehensive Mock Data for Testing
 * Multiple datasets for all pages, graphs, and features
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper: Generate MongoDB ObjectId
const id = () => new mongoose.Types.ObjectId();

// Helper: Create password hash
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

/**
 * USER DATA - Multiple users with different roles
 */
const generateUsers = async () => {
  const adminHash = await hashPassword('Admin@123456');
  const officerHash = await hashPassword('Officer@123456');
  const surveyorHash = await hashPassword('Surveyor@123456');

  return [
    {
      _id: id(),
      name: 'Admin User',
      email: 'admin@springrevival.gov',
      password_hash: adminHash,
      role: 'admin',
      phone: '+91-9876543210',
      district: 'Belgaum',
      state: 'Karnataka',
      is_active: true,
      avatar_url: 'https://via.placeholder.com/150?text=Admin',
      last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      created_at: new Date('2024-01-01')
    },
    {
      _id: id(),
      name: 'Officer 1 - Belgaum',
      email: 'officer1@springrevival.gov',
      password_hash: officerHash,
      role: 'officer',
      phone: '+91-9876543211',
      district: 'Belgaum',
      state: 'Karnataka',
      is_active: true,
      avatar_url: 'https://via.placeholder.com/150?text=Officer1',
      last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      created_at: new Date('2024-01-05')
    },
    {
      _id: id(),
      name: 'Officer 2 - Bagalkot',
      email: 'officer2@springrevival.gov',
      password_hash: officerHash,
      role: 'officer',
      phone: '+91-9876543212',
      district: 'Bagalkot',
      state: 'Karnataka',
      is_active: true,
      avatar_url: 'https://via.placeholder.com/150?text=Officer2',
      last_login: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      created_at: new Date('2024-01-10')
    },
    {
      _id: id(),
      name: 'Surveyor 1 - Field Team A',
      email: 'surveyor1@springrevival.gov',
      password_hash: surveyorHash,
      role: 'surveyor',
      phone: '+91-9876543213',
      district: 'Belgaum',
      state: 'Karnataka',
      is_active: true,
      avatar_url: 'https://via.placeholder.com/150?text=Surveyor1',
      last_login: new Date(Date.now() - 1 * 60 * 60 * 1000),
      created_at: new Date('2024-02-01')
    },
    {
      _id: id(),
      name: 'Surveyor 2 - Field Team B',
      email: 'surveyor2@springrevival.gov',
      password_hash: surveyorHash,
      role: 'surveyor',
      phone: '+91-9876543214',
      district: 'Belgaum',
      state: 'Karnataka',
      is_active: true,
      avatar_url: 'https://via.placeholder.com/150?text=Surveyor2',
      last_login: new Date(Date.now() - 12 * 60 * 60 * 1000),
      created_at: new Date('2024-02-05')
    },
    {
      _id: id(),
      name: 'Surveyor 3 - Field Team C',
      email: 'surveyor3@springrevival.gov',
      password_hash: surveyorHash,
      role: 'surveyor',
      phone: '+91-9876543215',
      district: 'Bagalkot',
      state: 'Karnataka',
      is_active: true,
      avatar_url: 'https://via.placeholder.com/150?text=Surveyor3',
      last_login: new Date(Date.now() - 18 * 60 * 60 * 1000),
      created_at: new Date('2024-02-10')
    }
  ];
};

/**
 * VILLAGE DATA - Multiple villages across districts
 */
const generateVillages = () => {
  const belgaumVillages = [
    {
      _id: id(),
      name: 'Belgaum East',
      taluk: 'Belgaum',
      district: 'Belgaum',
      state: 'Karnataka',
      pincode: '590001',
      population: 45000,
      tribal_pct: 8.5,
      area_sq_km: 15.2,
      location: {
        type: 'Point',
        coordinates: [75.6234, 15.8627]
      },
      created_at: new Date('2024-01-01')
    },
    {
      _id: id(),
      name: 'Belgaum West',
      taluk: 'Belgaum',
      district: 'Belgaum',
      state: 'Karnataka',
      pincode: '590002',
      population: 52000,
      tribal_pct: 12.3,
      area_sq_km: 18.5,
      location: {
        type: 'Point',
        coordinates: [75.5234, 15.8527]
      },
      created_at: new Date('2024-01-02')
    },
    {
      _id: id(),
      name: 'Belgaum North',
      taluk: 'Belgaum',
      district: 'Belgaum',
      state: 'Karnataka',
      pincode: '590003',
      population: 38000,
      tribal_pct: 15.6,
      area_sq_km: 22.1,
      location: {
        type: 'Point',
        coordinates: [75.6234, 15.9127]
      },
      created_at: new Date('2024-01-03')
    },
    {
      _id: id(),
      name: 'Belgaum South',
      taluk: 'Belgaum',
      district: 'Belgaum',
      state: 'Karnataka',
      pincode: '590004',
      population: 41000,
      tribal_pct: 18.2,
      area_sq_km: 19.8,
      location: {
        type: 'Point',
        coordinates: [75.6234, 15.8127]
      },
      created_at: new Date('2024-01-04')
    }
  ];

  const bagalkotVillages = [
    {
      _id: id(),
      name: 'Bagalkot Town',
      taluk: 'Bagalkot',
      district: 'Bagalkot',
      state: 'Karnataka',
      pincode: '587101',
      population: 35000,
      tribal_pct: 22.4,
      area_sq_km: 16.3,
      location: {
        type: 'Point',
        coordinates: [75.8234, 16.1927]
      },
      created_at: new Date('2024-01-05')
    },
    {
      _id: id(),
      name: 'Bagalkot Rural',
      taluk: 'Bagalkot',
      district: 'Bagalkot',
      state: 'Karnataka',
      pincode: '587102',
      population: 28000,
      tribal_pct: 28.7,
      area_sq_km: 24.5,
      location: {
        type: 'Point',
        coordinates: [75.7234, 16.1827]
      },
      created_at: new Date('2024-01-06')
    }
  ];

  return [...belgaumVillages, ...bagalkotVillages];
};

/**
 * SPRING DATA - Multiple springs across villages
 */
const generateSprings = (villages, users) => {
  const surveyor1 = users.find(u => u.email === 'surveyor1@springrevival.gov');
  const surveyor2 = users.find(u => u.email === 'surveyor2@springrevival.gov');

  const springs = [];
  const springTypes = ['gravity', 'artesian', 'perched'];
  const statuses = ['active', 'seasonal', 'dry'];

  // Generate 6-8 springs per village
  villages.forEach((village, vIdx) => {
    const springCount = 6 + Math.floor(Math.random() * 3);
    const [baseLon, baseLat] = village.location.coordinates;

    for (let i = 0; i < springCount; i++) {
      const offsetLon = (Math.random() - 0.5) * 0.05;
      const offsetLat = (Math.random() - 0.5) * 0.05;

      springs.push({
        _id: id(),
        village_id: village._id,
        name: `${village.name} Spring ${i + 1}`,
        spring_type: springTypes[Math.floor(Math.random() * springTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        location: {
          type: 'Point',
          coordinates: [baseLon + offsetLon, baseLat + offsetLat]
        },
        elevation_m: 500 + Math.floor(Math.random() * 400),
        discharge_lpm: Math.round(50 + Math.random() * 200),
        water_quality: {
          pH: 6.5 + Math.random() * 1.5,
          TDS: 200 + Math.random() * 400,
          turbidity_NTU: Math.random() * 10,
          temperature_C: 20 + Math.random() * 8
        },
        seasonal_flow: Math.random() > 0.7,
        description: `Natural spring in ${village.name} region`,
        discovered_date: new Date(2023 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        created_by: i % 2 === 0 ? surveyor1._id : surveyor2._id,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      });
    }
  });

  return springs;
};

/**
 * RAINFALL DATA - 30 days of historical rainfall for each village
 */
const generateRainfallData = (villages) => {
  const rainfallRecords = [];

  villages.forEach(village => {
    const [lon, lat] = village.location.coordinates;
    const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Generate 30 days of rainfall data
    for (let day = 0; day < 30; day++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + day);

      rainfallRecords.push({
        _id: id(),
        village_id: village._id,
        latitude: lat,
        longitude: lon,
        recorded_date: date,
        rainfall_mm: Math.max(0, Math.random() * 40 - 5), // 0-35mm
        temperature_max: 28 + Math.random() * 12,
        temperature_min: 18 + Math.random() * 8,
        humidity_pct: 50 + Math.random() * 40,
        wind_speed_kmh: Math.random() * 25,
        source: 'open-meteo',
        created_at: new Date()
      });
    }
  });

  return rainfallRecords;
};

/**
 * ELEVATION DATA - DEM data points for each village
 */
const generateElevationData = (villages) => {
  const elevationRecords = [];

  villages.forEach(village => {
    const [baseLon, baseLat] = village.location.coordinates;
    const baseElevation = 500 + Math.floor(Math.random() * 400);

    // Generate 9 elevation points (3x3 grid)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const offsetLon = (i - 1) * 0.02;
        const offsetLat = (j - 1) * 0.02;

        elevationRecords.push({
          _id: id(),
          village_id: village._id,
          latitude: baseLat + offsetLat,
          longitude: baseLon + offsetLon,
          elevation_m: baseElevation + Math.floor(Math.random() * 100) - 50,
          slope_deg: Math.random() * 30,
          aspect_deg: Math.random() * 360,
          curvature: Math.random() * 2 - 1,
          location: {
            type: 'Point',
            coordinates: [baseLon + offsetLon, baseLat + offsetLat]
          },
          source: 'open-topodata',
          created_at: new Date()
        });
      }
    }
  });

  return elevationRecords;
};

/**
 * RECHARGE ANALYSIS - AI predictions for each spring
 */
const generateRechargeAnalysis = (springs, villages, users) => {
  const officer = users.find(u => u.role === 'officer');
  const analyses = [];

  springs.forEach(spring => {
    const village = villages.find(v => v._id === spring.village_id);
    const [lon, lat] = spring.location.coordinates;

    const riskLevels = ['low', 'medium', 'high', 'critical'];
    const interventions = [
      'check_dam',
      'recharge_pit',
      'contour_trench',
      'percolation_tank',
      'spring_protection',
      'gabion_structure'
    ];

    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const score = riskLevel === 'critical' ? 20 + Math.random() * 20
                : riskLevel === 'high' ? 30 + Math.random() * 25
                : riskLevel === 'medium' ? 50 + Math.random() * 25
                : 70 + Math.random() * 30;

    const selectedInterventions = [];
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      if (!selectedInterventions.includes(interventions[i])) {
        selectedInterventions.push(interventions[i]);
      }
    }

    analyses.push({
      _id: id(),
      village_id: village._id,
      spring_id: spring._id,
      latitude: lat,
      longitude: lon,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      recharge_score: Math.round(score),
      confidence_score: 75 + Math.random() * 25,
      risk_level: riskLevel,
      annual_rainfall_mm: 600 + Math.random() * 400,
      elevation_m: spring.elevation_m || 500,
      slope_deg: 15 + Math.random() * 25,
      soil_permeability: 0.1 + Math.random() * 0.5,
      land_use_code: ['forest', 'agriculture', 'grassland', 'urban'][Math.floor(Math.random() * 4)],
      geology_type: ['granite', 'sandstone', 'limestone', 'basalt'][Math.floor(Math.random() * 4)],
      distance_to_stream_m: 100 + Math.random() * 900,
      ndvi_value: 0.3 + Math.random() * 0.4,
      interventions: selectedInterventions,
      analysis_details: {
        model_name: 'SpringRecharge_v1',
        features_used: 11,
        training_accuracy: 0.87,
        confidence_factors: {
          rainfall: 0.92,
          elevation: 0.85,
          geology: 0.78,
          vegetation: 0.82
        }
      },
      model_version: '1.0.0',
      analyzed_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      created_by: officer._id
    });
  });

  return analyses;
};

/**
 * FIELD VERIFICATION - Survey records with varying statuses
 */
const generateFieldVerification = (springs, villages, users) => {
  const surveyors = users.filter(u => u.role === 'surveyor');
  const officer = users.find(u => u.role === 'officer');
  const verifications = [];

  const statuses = ['pending', 'in_progress', 'completed', 'verified'];
  const waterColors = ['clear', 'milky', 'brown', 'greenish'];
  const odors = ['none', 'musty', 'sulfurous'];
  const soilTypes = ['clay', 'sandy', 'loamy', 'rocky'];
  const landUses = ['forest', 'agriculture', 'grassland', 'residential'];

  // Generate 2-4 surveys per spring
  springs.forEach(spring => {
    const surveyCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < surveyCount; i++) {
      const surveyor = surveyors[Math.floor(Math.random() * surveyors.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const [lon, lat] = spring.location.coordinates;
      const offsetLon = (Math.random() - 0.5) * 0.001;
      const offsetLat = (Math.random() - 0.5) * 0.001;

      const survey = {
        _id: id(),
        spring_id: spring._id,
        surveyor_id: surveyor._id,
        village_id: spring.village_id,
        survey_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        status: status,
        gps_latitude: lat + offsetLat,
        gps_longitude: lon + offsetLon,
        gps_accuracy_m: 5 + Math.random() * 10,
        location: {
          type: 'Point',
          coordinates: [lon + offsetLon, lat + offsetLat]
        },
        discharge_observed_lpm: 40 + Math.random() * 180,
        water_color: waterColors[Math.floor(Math.random() * waterColors.length)],
        odor: odors[Math.floor(Math.random() * odors.length)],
        surrounding_vegetation: 'Mixed forest with agricultural patches',
        soil_type: soilTypes[Math.floor(Math.random() * soilTypes.length)],
        land_use_observed: landUses[Math.floor(Math.random() * landUses.length)],
        ph_value: 6.5 + Math.random() * 1.5,
        tds_ppm: 200 + Math.random() * 400,
        turbidity_ntu: Math.random() * 8,
        condition_rating: 2 + Math.floor(Math.random() * 4),
        notes: `Field survey conducted at ${new Date().toLocaleDateString()}. Spring appears ${status === 'verified' ? 'healthy' : 'needs monitoring'}.`,
        recommendations: 'Monitor for seasonal variation. Consider protection measures.',
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      };

      if (status === 'verified') {
        survey.verified_by = officer._id;
        survey.verified_at = new Date();
      }

      verifications.push(survey);
    }
  });

  return verifications;
};

/**
 * UPLOADED PHOTOS - Sample photo metadata
 */
const generateUploadedPhotos = (verifications, users) => {
  const photos = [];
  const photoTypes = ['survey', 'before', 'after', 'drone'];

  // Generate 1-3 photos per verification
  verifications.forEach(verification => {
    const photoCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < photoCount; i++) {
      photos.push({
        _id: id(),
        verification_id: verification._id,
        spring_id: verification.spring_id,
        uploaded_by: verification.surveyor_id,
        url: `https://via.placeholder.com/800?text=Spring+Photo+${Math.floor(Math.random() * 1000)}`,
        thumbnail_url: `https://via.placeholder.com/150?text=Thumb`,
        filename: `spring_survey_${verification._id}_photo_${i + 1}.jpg`,
        file_size_bytes: 2000000 + Math.floor(Math.random() * 3000000),
        mime_type: 'image/jpeg',
        geo_lat: verification.gps_latitude,
        geo_lon: verification.gps_longitude,
        location: verification.location,
        caption: `Survey photo - ${photoTypes[i % photoTypes.length]}`,
        photo_type: photoTypes[i % photoTypes.length],
        taken_at: verification.survey_date,
        created_at: new Date()
      });
    }
  });

  return photos;
};

module.exports = {
  generateUsers,
  generateVillages,
  generateSprings,
  generateRainfallData,
  generateElevationData,
  generateRechargeAnalysis,
  generateFieldVerification,
  generateUploadedPhotos
};
