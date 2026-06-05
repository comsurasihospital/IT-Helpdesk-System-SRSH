const { body, param, query, validationResult } = require('express-validator');
const response = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.validationError(res, errors.array());
  }
  next();
};

const rules = {

  lineLogin: [
    body('lineUserId').notEmpty().withMessage('LINE User ID required'),
    body('lineDisplayName').optional().isString(),
  ],

  register: [
    body('lineUserId').notEmpty().withMessage('LINE User ID required'),
    body('firstName').notEmpty().trim().withMessage('required'),
    body('lastName').notEmpty().trim().withMessage('required'),
    body('phone').optional({ nullable: true, checkFalsy: true }),
    body('departmentId').notEmpty().toInt().isInt({ min: 1 }).withMessage('required'),
  ],

  createTicket: [
    body('categoryId').notEmpty().toInt().isInt({ min: 1 }).withMessage('required'),
    body('title').notEmpty().trim().isLength({ min: 2, max: 300 }).withMessage('required'),
    body('description').notEmpty().trim().isLength({ min: 3 }).withMessage('required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  ],

  updateTicket: [
    param('id').toInt().isInt({ min: 1 }),
    body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    body('resolutionNote').optional().trim(),
  ],

  acceptTicket: [
    param('id').toInt().isInt({ min: 1 }),
  ],

  closeTicket: [
    param('id').toInt().isInt({ min: 1 }),
    body('acceptedAt').notEmpty().withMessage('required'),
    body('resolvedAt').notEmpty().withMessage('required'),
    body('slaType').notEmpty().withMessage('required'),
    body('rootCause').notEmpty().trim().withMessage('required'),
    body('resolutionNote').notEmpty().trim().withMessage('required'),
  ],

  rateTicket: [
    param('id').toInt().isInt({ min: 1 }),
    body('score').toInt().isInt({ min: 1, max: 5 }),
    body('note').optional().trim().isLength({ max: 500 }),
  ],

  addComment: [
    param('id').toInt().isInt({ min: 1 }),
    body('comment').notEmpty().trim().withMessage('required'),
    body('isInternal').optional().isBoolean(),
  ],

  ticketList: [
    query('page').optional().toInt().isInt({ min: 1 }),
    query('limit').optional().toInt().isInt({ min: 1, max: 1000 }),
    query('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    query('categoryId').optional().toInt().isInt({ min: 1 }),
  ],
};

module.exports = { validate, rules };