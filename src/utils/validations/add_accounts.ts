import * as Yup from 'yup';

// Create a function that receives the translation function `t`
export const erpAddAccountValidationSchema = (t) =>
  Yup.object().shape({
    company_code: Yup.string().required(t('company_code_required')),
    user: Yup.string().required(t('user_name_required')),
    password: Yup.string().required(t('password_required')),
  });
