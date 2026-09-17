const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const Spring = require('../models/Spring');
const RechargeAnalysis = require('../models/RechargeAnalysis');
const Village = require('../models/Village');
const Report = require('../models/Report');
const { authenticate, authorize } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/reports/export/csv
 */
router.get('/export/csv', authorize('admin', 'officer'), async (req, res) => {
  try {
    const { village_id } = req.query;
    let query = {};
    
    if (village_id) {
      // Convert string village_id to ObjectId
      if (mongoose.Types.ObjectId.isValid(village_id)) {
        query.village_id = new mongoose.Types.ObjectId(village_id);
      }
    }

    const springs = await withMockDataFallback(
      Spring.find(query)
        .populate('village_id', 'name district state')
        .lean(),
      'springs',
      { filter: (s) => !village_id || String(s.village_id) === village_id }
    );

    const data = await Promise.all((Array.isArray(springs) ? springs : []).map(async (s) => {
      let analysis = null;
      try {
        const springObjectId = s._id instanceof mongoose.Types.ObjectId ? s._id : new mongoose.Types.ObjectId(s._id);
        analysis = await withMockDataFallback(
          RechargeAnalysis.findOne({ spring_id: springObjectId })
            .sort({ analyzed_at: -1 })
            .lean(),
          'rechargeAnalysis',
          { filter: (r) => String(r.spring_id) === String(s._id) }
        );
      } catch (e) {
        console.error('Error fetching analysis:', e);
      }

      return {
        village: s.village_id?.name || '—',
        district: s.village_id?.district || '—',
        state: s.village_id?.state || '—',
        spring_name: s.name || '—',
        spring_status: s.status || '—',
        elevation_m: s.elevation_m || '—',
        discharge_lpm: s.discharge_lpm || '—',
        latitude: s.location?.coordinates[1] || '—',
        longitude: s.location?.coordinates[0] || '—',
        recharge_score: analysis?.recharge_score || '—',
        confidence_score: analysis?.confidence_score || '—',
        risk_level: analysis?.risk_level || '—',
        annual_rainfall_mm: analysis?.annual_rainfall_mm || '—',
        slope_deg: analysis?.slope_deg || '—',
        recommended_interventions: analysis?.interventions ? analysis.interventions.join(', ') : '—',
        analyzed_at: analysis?.analyzed_at || '—'
      };
    }));

    const fields = [
      'village', 'district', 'state', 'spring_name', 'spring_status',
      'elevation_m', 'discharge_lpm', 'latitude', 'longitude',
      'recharge_score', 'confidence_score', 'risk_level',
      'annual_rainfall_mm', 'slope_deg', 'recommended_interventions', 'analyzed_at'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="spring-revival-report.csv"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV', details: err.message });
  }
});

/**
 * GET /api/reports/export/pdf
 */
router.get('/export/pdf', authorize('admin', 'officer'), async (req, res) => {
  try {
    const { village_id } = req.query;
    let query = {};
    
    if (village_id) {
      // Convert string village_id to ObjectId
      if (mongoose.Types.ObjectId.isValid(village_id)) {
        query.village_id = new mongoose.Types.ObjectId(village_id);
      }
    }

    const springs = await withMockDataFallback(
      Spring.find(query)
        .populate('village_id', 'name district state')
        .lean(),
      'springs',
      { filter: (s) => !village_id || String(s.village_id._id || s.village_id) === village_id }
    );

    let village = null;
    if (village_id && mongoose.Types.ObjectId.isValid(village_id)) {
      village = await withMockDataFallback(
        Village.findById(new mongoose.Types.ObjectId(village_id)).select('name district state').lean(),
        'villages',
        { filter: (v) => String(v._id) === village_id }
      );
    }

    const springsWithAnalysis = await Promise.all((Array.isArray(springs) ? springs : []).map(async (s) => {
      let analysis = null;
      try {
        const springObjectId = s._id instanceof mongoose.Types.ObjectId ? s._id : new mongoose.Types.ObjectId(s._id);
        analysis = await withMockDataFallback(
          RechargeAnalysis.findOne({ spring_id: springObjectId })
            .sort({ analyzed_at: -1 })
            .lean(),
          'rechargeAnalysis',
          { filter: (r) => String(r.spring_id) === String(s._id) }
        );
      } catch (e) {
        console.error('Error fetching analysis:', e);
      }

      return {
        name: s.name,
        status: s.status,
        elevation_m: s.elevation_m,
        discharge_lpm: s.discharge_lpm,
        village_name: s.village_id?.name,
        district: s.village_id?.district,
        recharge_score: analysis?.recharge_score,
        risk_level: analysis?.risk_level,
        interventions: analysis?.interventions ? analysis.interventions.join(', ') : ''
      };
    }));

    const stats = {
      total: springsWithAnalysis.length,
      avg_score: springsWithAnalysis.length > 0
        ? springsWithAnalysis.reduce((sum, s) => sum + (s.recharge_score || 0), 0) / springsWithAnalysis.length
        : 0,
      high_risk: springsWithAnalysis.filter(s => s.risk_level === 'high').length
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="spring-revival-report.pdf"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    const v = village || { name: 'All Regions', district: '', state: 'India' };

    doc.fontSize(20).fillColor('#1a5276')
      .text('Spring Revival & Recharge Planning Report', { align: 'center' });
    doc.fontSize(12).fillColor('#555')
      .text('Ministry of Tribal Affairs, Government of India', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333')
      .text(`Generated: ${new Date().toLocaleDateString('en-IN')}  |  Region: ${v.name}${v.district ? ', ' + v.district : ''}${v.state ? ', ' + v.state : ''}`,
        { align: 'center' });

    doc.moveDown().moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#aaa').stroke();
    doc.moveDown();

    doc.fontSize(14).fillColor('#1a5276').text('Summary Statistics');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Total Springs Assessed: ${stats.total}`);
    doc.text(`Average Recharge Score: ${stats.avg_score.toFixed(1)} / 100`);
    doc.text(`High Risk Zones: ${stats.high_risk}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#1a5276').text('Spring-wise Analysis');
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const cols = [0, 120, 195, 265, 320, 390, 545];
    const headers = ['Spring Name', 'Village', 'Status', 'Score', 'Risk', 'Interventions'];

    doc.fontSize(9).fillColor('#fff');
    doc.rect(50, tableTop, 495, 18).fill('#1a5276');
    headers.forEach((h, i) => {
      doc.fillColor('#fff').text(h, 52 + cols[i], tableTop + 4, { width: cols[i + 1] - cols[i] - 4 });
    });

    let rowY = tableTop + 20;
    springsWithAnalysis.forEach((row, idx) => {
      if (rowY > 720) { doc.addPage(); rowY = 50; }
      const bg = idx % 2 === 0 ? '#f0f4f8' : '#ffffff';
      doc.rect(50, rowY, 495, 16).fill(bg);
      doc.fillColor('#333').fontSize(8);
      const cells = [
        row.name || '—', row.village_name || '—', row.status || '—',
        row.recharge_score ? row.recharge_score.toFixed(1) : '—',
        row.risk_level || '—', row.interventions || '—'
      ];
      cells.forEach((cell, i) => {
        doc.text(String(cell), 52 + cols[i], rowY + 3, { width: cols[i + 1] - cols[i] - 4 });
      });
      rowY += 16;
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#888')
      .text('Smart India Hackathon 2026 | Spring Revival Project | Confidential Government Document',
        { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to export PDF', details: err.message });
  }
});

/**
 * GET /api/reports
 */
router.get('/', async (req, res) => {
  const reports = await Report.find({})
    .populate('generated_by', 'name')
    .populate('village_id', 'name')
    .sort({ created_at: -1 })
    .limit(50)
    .lean();

  res.json({ reports });
});

module.exports = router;
