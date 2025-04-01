import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Tag from '../models/Tag';
import { validateTag } from '../utils/validation';

interface AuthRequest extends Request {
  user?: any;
}

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const tags = await Tag.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']],
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateTag(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, color } = req.body;
    
    // Check if tag with same name exists for this user
    const existingTag = await Tag.findOne({
      where: { name, userId: req.user.id },
    });

    if (existingTag) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    const tag = await Tag.create({
      name,
      color,
      userId: req.user.id,
    });

    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = validateTag(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const tag = await Tag.findOne({
      where: { id, userId: req.user.id },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const { name, color } = req.body;

    // Check if another tag with same name exists
    const existingTag = await Tag.findOne({
      where: {
        name,
        userId: req.user.id,
        id: { [Op.ne]: id },
      },
    });

    if (existingTag) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    await tag.update({ name, color });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findOne({
      where: { id, userId: req.user.id },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.destroy();
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}; 