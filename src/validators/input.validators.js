const { z } = require('zod');

const LIMITS = {
  nameMin: 2,
  nameMax: 50,
  emailMax: 100,
  passwordMin: 8,
  passwordMax: 50,
  phoneMinDigits: 7,
  phoneMaxDigits: 15,
  geofenceNameMax: 50,
  geofenceRadiusMin: 10,
  geofenceRadiusMax: 50000,
};

const roleSchema = z.enum(['ADMIN', 'SUPERVISOR', 'CLIENT', 'USER'], {
  errorMap: () => ({
    message: 'role must be one of ADMIN, SUPERVISOR, CLIENT, USER',
  }),
});

const nombreSchema = z
  .string()
  .trim()
  .min(1, { message: 'name is required' })
  .min(LIMITS.nameMin, {
    message: `name must have at least ${LIMITS.nameMin} characters`,
  })
  .max(LIMITS.nameMax, {
    message: `name must have at most ${LIMITS.nameMax} characters`,
  })
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'name must contain letters and spaces only',
  });

const correoSchema = z
  .string()
  .trim()
  .min(1, { message: 'email is required' })
  .max(LIMITS.emailMax, {
    message: `email must have at most ${LIMITS.emailMax} characters`,
  })
  .email({ message: 'email must be valid' });

const passwordSchema = z
  .string()
  .min(1, { message: 'password is required' })
  .min(LIMITS.passwordMin, {
    message: `password must have at least ${LIMITS.passwordMin} characters`,
  })
  .max(LIMITS.passwordMax, {
    message: `password must have at most ${LIMITS.passwordMax} characters`,
  });

const telefonoSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z
    .string()
    .regex(/^[0-9+()\s-]+$/, {
      message: 'phone must contain valid characters only',
    })
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, '');
        return (
          digits.length >= LIMITS.phoneMinDigits &&
          digits.length <= LIMITS.phoneMaxDigits
        );
      },
      {
        message: `phone must have between ${LIMITS.phoneMinDigits} and ${LIMITS.phoneMaxDigits} digits`,
      },
    )
    .optional(),
);

const supervisorCodeSchema = z.coerce
  .number({
    invalid_type_error: 'supervisor code must be numeric',
  })
  .int({ message: 'supervisor code must be an integer' })
  .positive({ message: 'supervisor code must be greater than 0' });

const userIdSchema = z.coerce
  .number({ invalid_type_error: 'supervisorId must be numeric' })
  .int({ message: 'supervisorId must be an integer' })
  .positive({ message: 'supervisorId must be greater than 0' });

const coordinateSchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, { message: 'latitude must be between -90 and 90' })
    .max(90, { message: 'latitude must be between -90 and 90' }),
  lng: z.coerce
    .number()
    .min(-180, { message: 'longitude must be between -180 and 180' })
    .max(180, { message: 'longitude must be between -180 and 180' }),
});

const geofencePayloadSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, { message: 'geofence name is required' })
      .max(LIMITS.geofenceNameMax, {
        message: `geofence name must have at most ${LIMITS.geofenceNameMax} characters`,
      }),
    tipo: z.enum(['CIRCLE', 'POLYGON'], {
      errorMap: () => ({ message: 'type must be CIRCLE or POLYGON' }),
    }),
    coordenadas: z.any(),
    radio: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'CIRCLE') {
      const circleResult = coordinateSchema.safeParse(data.coordenadas);
      if (!circleResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: circleResult.error.issues[0].message,
          path: ['coordenadas'],
        });
      }

      const radius = data.radio;
      if (radius === undefined || Number.isNaN(radius)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'radius is required for CIRCLE geofence',
          path: ['radio'],
        });
        return;
      }

      if (
        radius < LIMITS.geofenceRadiusMin ||
        radius > LIMITS.geofenceRadiusMax
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `radius must be between ${LIMITS.geofenceRadiusMin} and ${LIMITS.geofenceRadiusMax} meters`,
          path: ['radio'],
        });
      }
    }

    if (data.tipo === 'POLYGON') {
      if (!Array.isArray(data.coordenadas)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'polygon coordinates must be an array',
          path: ['coordenadas'],
        });
        return;
      }

      if (data.coordenadas.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'polygon must have at least 3 points',
          path: ['coordenadas'],
        });
        return;
      }

      data.coordenadas.forEach((point, index) => {
        const pointResult = coordinateSchema.safeParse(point);
        if (!pointResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: pointResult.error.issues[0].message,
            path: ['coordenadas', index],
          });
        }
      });
    }
  });

const registerSchema = z.object({
  nombre: nombreSchema,
  correo: correoSchema,
  password: passwordSchema,
  telefono: telefonoSchema,
  codigo_supervisor: supervisorCodeSchema,
});

const loginSchema = z.object({
  correo: correoSchema,
  password: z.string().min(1, { message: 'password is required' }),
  device_id: z
    .string()
    .max(100, { message: 'device_id must have at most 100 characters' })
    .optional(),
});

const createUserSchema = z.object({
  nombre: nombreSchema,
  correo: correoSchema,
  password: passwordSchema,
  telefono: telefonoSchema,
  rol: roleSchema.optional(),
  supervisorId: userIdSchema.optional(),
});

const updateUserSchema = z.object({
  nombre: nombreSchema,
  correo: correoSchema,
  telefono: telefonoSchema,
  rol: roleSchema.optional(),
  is_active: z.boolean({ invalid_type_error: 'is_active must be boolean' }),
});

const getValidationMessage = (error) =>
  error?.issues?.[0]?.message || 'invalid input';

module.exports = {
  LIMITS,
  registerSchema,
  loginSchema,
  createUserSchema,
  updateUserSchema,
  geofencePayloadSchema,
  userIdSchema,
  getValidationMessage,
};
