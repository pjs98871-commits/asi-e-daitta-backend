const { Contact, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// 문의사항 생성
const createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      company,
      subject,
      message,
      category,
      priority,
    } = req.body;

    // IP 주소와 User Agent 수집
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const contact = await Contact.create({
      name,
      email,
      phoneNumber,
      company,
      subject,
      message,
      category,
      priority: priority || 'medium',
      ipAddress,
      userAgent,
    });

    logger.info(`New contact created: ${contact.id} from ${email}`);

    res.status(201).json({
      success: true,
      message: 'Contact request submitted successfully',
      data: { contact },
    });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact request',
      error: error.message,
    });
  }
};

// 문의사항 목록 조회
const getContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // 필터링
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // 검색
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        contacts: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contacts',
      error: error.message,
    });
  }
};

// 문의사항 상세 조회
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
      ],
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: { contact },
    });
  } catch (error) {
    logger.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact',
      error: error.message,
    });
  }
};

// 문의사항 업데이트 (관리자만)
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, responseMessage } = req.body;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (responseMessage) {
      updateData.responseMessage = responseMessage;
      updateData.respondedAt = new Date();
    }

    // 상태가 resolved로 변경되면 해결 시간 기록
    if (status === 'resolved' && contact.status !== 'resolved') {
      updateData.resolvedAt = new Date();
    }

    await contact.update(updateData);

    logger.info(`Contact updated: ${contact.id}`);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact },
    });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message,
    });
  }
};

// 문의사항에 응답 (관리자만)
const respondToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseMessage, status } = req.body;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    const updateData = {
      responseMessage,
      respondedAt: new Date(),
      status: status || 'in_progress',
    };

    // 상태가 resolved로 변경되면 해결 시간 기록
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    await contact.update(updateData);

    logger.info(`Response added to contact: ${contact.id}`);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { contact },
    });
  } catch (error) {
    logger.error('Respond to contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to contact',
      error: error.message,
    });
  }
};

// 문의사항 할당 (관리자만)
const assignContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // 할당할 사용자가 존재하는지 확인
    const assignee = await User.findByPk(assignedTo);

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found',
      });
    }

    await contact.update({
      assignedTo,
      status: contact.status === 'new' ? 'in_progress' : contact.status,
    });

    logger.info(`Contact ${contact.id} assigned to user ${assignedTo}`);

    res.json({
      success: true,
      message: 'Contact assigned successfully',
      data: { contact },
    });
  } catch (error) {
    logger.error('Assign contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign contact',
      error: error.message,
    });
  }
};

// 문의사항 삭제 (관리자만)
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    await contact.destroy();

    logger.info(`Contact deleted: ${id}`);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message,
    });
  }
};

// 내가 할당받은 문의사항 조회
const getMyAssignedContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { assignedTo: userId };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        contacts: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get my assigned contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assigned contacts',
      error: error.message,
    });
  }
};

// 문의사항 통계 (관리자만)
const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.findAll({
      attributes: [
        'status',
        'category',
        'priority',
        [Contact.sequelize.fn('COUNT', Contact.sequelize.col('id')), 'count'],
      ],
      group: ['status', 'category', 'priority'],
      raw: true,
    });

    const totalContacts = await Contact.count();
    const newContacts = await Contact.count({ where: { status: 'new' } });
    const inProgressContacts = await Contact.count({ where: { status: 'in_progress' } });
    const resolvedContacts = await Contact.count({ where: { status: 'resolved' } });

    res.json({
      success: true,
      data: {
        summary: {
          total: totalContacts,
          new: newContacts,
          inProgress: inProgressContacts,
          resolved: resolvedContacts,
        },
        detailed: stats,
      },
    });
  } catch (error) {
    logger.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact statistics',
      error: error.message,
    });
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  respondToContact,
  assignContact,
  deleteContact,
  getMyAssignedContacts,
  getContactStats,
};