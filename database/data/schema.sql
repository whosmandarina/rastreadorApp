CREATE TABLE IF NOT EXISTS Users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    identificador_interno VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'SUPERVISOR', 'CLIENT', 'USER') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Clients (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    id_user_admin INT, -- Usuario con rol CLIENT que administra esta cuenta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user_admin) REFERENCES Users(id_user) ON DELETE SET NULL
);

-- Relación de un usuario rastreado (USER) con un cliente (empresa)
CREATE TABLE IF NOT EXISTS User_Client (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT,
    id_client INT,
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_client) REFERENCES Clients(id_client) ON DELETE CASCADE
);

-- Relación de supervisor con usuarios a rastrear
CREATE TABLE IF NOT EXISTS Supervisor_User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_supervisor INT,
    id_user INT,
    FOREIGN KEY (id_supervisor) REFERENCES Users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Locations (
    id_location BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    precision_gps FLOAT,
    velocidad FLOAT,
    bateria INT,
    senal VARCHAR(50),
    timestamp_captura DATETIME NOT NULL,
    timestamp_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_sincronizacion ENUM('REALTIME', 'OFFLINE_SYNC') DEFAULT 'REALTIME',
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Geofences (
    id_geofence INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo ENUM('CIRCLE', 'POLYGON') NOT NULL,
    coordenadas JSON NOT NULL, -- Para polígonos: array de lat/lng. Para círculo: lat, lng de centro
    radio FLOAT, -- Solo usado si tipo es CIRCLE
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id_user) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Geofence_Events (
    id_event BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_geofence INT NOT NULL,
    tipo_evento ENUM('ENTER', 'EXIT') NOT NULL,
    timestamp_evento DATETIME NOT NULL,
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_geofence) REFERENCES Geofences(id_geofence) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Alerts (
    id_alert BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    tipo_alerta ENUM('BATTERY_LOW', 'SIGNAL_LOST', 'DISCONNECTED', 'DEVICE_OFF', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT') NOT NULL,
    descripcion TEXT,
    timestamp_alerta DATETIME NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Consents (
    id_consent INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    accepted_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Sessions (
    id_session INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    token_jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID para revocar tokens
    device_id VARCHAR(255),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Audit_Logs (
    id_audit BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_user_action INT, -- El usuario que realizó la acción. Puede ser NULL si la acción es del sistema.
    action_type VARCHAR(255) NOT NULL, -- Ej: 'USER_CREATE', 'GEOFENCE_DELETE', 'SUPERVISOR_ASSIGN'
    target_entity VARCHAR(100), -- Ej: 'Users', 'Geofences'
    target_id BIGINT, -- El ID de la entidad afectada
    details TEXT, -- Descripción en texto plano de la acción
    timestamp_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user_action) REFERENCES Users(id_user) ON DELETE SET NULL
);