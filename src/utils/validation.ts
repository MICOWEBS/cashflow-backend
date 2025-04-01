import Joi from 'joi';

export const validateRegistration = (data: any) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/).messages({
      'string.pattern.base': 'Phone number must be a valid international format',
      'any.required': 'Phone number is required'
    }),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};

export const validateTransaction = (data: any) => {
  const schema = Joi.object({
    type: Joi.string().valid('payment', 'sale').required(),
    amount: Joi.number().required().min(0),
    date: Joi.date().required(),
    paymentMode: Joi.string().valid('Cash', 'Check', 'Credit Card').required(),
    remarks: Joi.string().allow('', null),
    vendorId: Joi.number().when('type', {
      is: 'payment',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    customerId: Joi.number().when('type', {
      is: 'sale',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
  });

  return schema.validate(data);
};

export const validateCustomerVendor = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    companyName: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
  });

  return schema.validate(data);
};

export const validateAdminPasswordReset = (data: any) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export const validateForgotPassword = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  return schema.validate(data);
};

export const validateTag = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    color: Joi.string().required(),
  });

  return schema.validate(data);
};

export const validateUpdateProfile = (data: any) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).messages({
      'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)'
    }),
    currentPassword: Joi.string().when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    newPassword: Joi.string().min(6).max(30)
  });

  return schema.validate(data);
}; 