// 配置项中英文注释说明
export interface FieldDescription {
  zh: string
  en: string
}

export interface ConfigFieldDescriptions {
  settings: { [key: string]: FieldDescription }
  configuration: { [key: string]: FieldDescription }
  event: { [key: string]: FieldDescription }
  eventRules: { [key: string]: FieldDescription }
  assistRules: { [key: string]: FieldDescription }
  entryList: { [key: string]: FieldDescription }
  bop: { [key: string]: FieldDescription }
}

export const fieldDescriptions: ConfigFieldDescriptions = {
  settings: {
    serverName: {
      zh: '服务器的显示名称，将显示在服务器列表中',
      en: 'Display name of the server, shown in the server list'
    },
    adminPassword: {
      zh: '管理员密码，用于访问服务器管理功能',
      en: 'Administrator password for accessing server management features'
    },
    password: {
      zh: '服务器连接密码，留空为公开服务器',
      en: 'Server connection password, leave empty for public server'
    },
    spectatorPassword: {
      zh: '观察者密码，用于观看比赛但不能参赛',
      en: 'Spectator password for watching races without participating'
    },
    centralEntryListPath: {
      zh: '中央参赛名单文件路径，用于多服务器共享同一参赛名单',
      en: 'Central entry list file path for sharing entry list across multiple servers'
    },
    carGroup: {
      zh: '车辆组类型，决定服务器允许的车辆类别',
      en: 'Car group type, determines allowed car categories on the server'
    },
    trackMedalsRequirement: {
      zh: '赛道奖牌等级要求，0=无要求，1-3=对应奖牌等级',
      en: 'Track medal requirement, 0=no requirement, 1-3=corresponding medal levels'
    },
    safetyRatingRequirement: {
      zh: '安全评分要求，-1=禁用，0-99=最低安全评分',
      en: 'Safety rating requirement, -1=disabled, 0-99=minimum safety rating'
    },
    racecraftRatingRequirement: {
      zh: '竞速评分要求，-1=禁用，0-99=最低竞速评分',
      en: 'Racecraft rating requirement, -1=disabled, 0-99=minimum racecraft rating'
    },
    maxCarSlots: {
      zh: '最大可参与的车手数量（1-60）',
      en: 'Maximum number of participating drivers (1-60)'
    },
    isRaceLocked: {
      zh: '锁定赛事，禁止更改车辆和赛道设置',
      en: 'Lock race, prevents changes to car and track settings'
    },
    isLockedPrepPhase: {
      zh: '锁定准备阶段，禁止在准备阶段离开',
      en: 'Lock preparation phase, prevents leaving during prep phase'
    },
    shortFormationLap: {
      zh: '启用短编队圈，加速比赛开始',
      en: 'Enable short formation lap to speed up race start'
    },
    dumpLeaderboards: {
      zh: '保存排行榜数据到文件',
      en: 'Save leaderboard data to file'
    },
    dumpEntryList: {
      zh: '保存参赛名单到文件',
      en: 'Save entry list to file'
    },
    randomizeTrackWhenEmpty: {
      zh: '空场时随机选择赛道',
      en: 'Randomly select track when server is empty'
    },
    allowAutoDQ: {
      zh: '允许自动取消资格，对违规行为自动处罚',
      en: 'Allow automatic disqualification for rule violations'
    },
    ignorePrematureDisconnects: {
      zh: '忽略过早断开连接的处罚',
      en: 'Ignore penalties for premature disconnections'
    },
    formationLapType: {
      zh: '编队圈类型，0=无，1=静止，2=滚动，3=自由编队',
      en: 'Formation lap type, 0=none, 1=standing, 2=rolling, 3=free rolling'
    },
    configVersion: {
      zh: '配置文件版本号，用于兼容性检查',
      en: 'Configuration file version number for compatibility checking'
    }
  },
  configuration: {
    udpPort: {
      zh: 'UDP 端口，用于实时遥测数据传输',
      en: 'UDP port for real-time telemetry data transmission'
    },
    tcpPort: {
      zh: 'TCP 端口，用于 HTTP API 和远程管理',
      en: 'TCP port for HTTP API and remote management'
    },
    maxConnections: {
      zh: '最大并发连接数',
      en: 'Maximum concurrent connections'
    },
    lanDiscovery: {
      zh: '启用局域网发现，0=禁用，1=启用',
      en: 'Enable LAN discovery, 0=disabled, 1=enabled'
    },
    registerToLobby: {
      zh: '注册到服务器大厅，0=禁用，1=启用',
      en: 'Register to server lobby, 0=disabled, 1=enabled'
    },
    configVersion: {
      zh: '配置文件版本号',
      en: 'Configuration file version number'
    }
  },
  event: {
    ambientTemp: {
      zh: '环境温度（摄氏度）',
      en: 'Ambient temperature in Celsius'
    },
    cloudLevel: {
      zh: '云层覆盖度（0-1）',
      en: 'Cloud coverage level (0-1)'
    },
    rain: {
      zh: '降雨强度（0-1）',
      en: 'Rain intensity (0-1)'
    },
    track: {
      zh: '比赛赛道名称',
      en: 'Race track name'
    },
    weatherRandomness: {
      zh: '天气随机性，0=固定天气，1=动态变化',
      en: 'Weather randomness, 0=fixed, 1=dynamic'
    },
    simracerWeatherConditions: {
      zh: '模拟赛车手天气条件模式',
      en: 'Sim racer weather conditions mode'
    },
    preRaceWaitingTimeSeconds: {
      zh: '赛前等待时间（秒）',
      en: 'Pre-race waiting time in seconds'
    },
    sessionOverTimeSeconds: {
      zh: '比赛超时时间（秒）',
      en: 'Race overtime in seconds'
    },
    postQualySeconds: {
      zh: '排位赛后等待时间（秒）',
      en: 'Post-qualification waiting time in seconds'
    },
    postRaceSeconds: {
      zh: '比赛后等待时间（秒）',
      en: 'Post-race waiting time in seconds'
    },
    isFixedConditionQualification: {
      zh: '排位赛固定天气条件',
      en: 'Fixed weather conditions for qualification'
    },
    configVersion: {
      zh: '配置文件版本号',
      en: 'Configuration file version number'
    }
  },
  eventRules: {
    qualifyStandingType: {
      zh: '排位赛站位类型，0=最快圈速，1=最后排位赛成绩',
      en: 'Qualification standing type, 0=fastest lap, 1=last qualifying result'
    },
    pitWindowLengthSec: {
      zh: '进站窗口长度（秒），-1=无限制',
      en: 'Pit window length in seconds, -1=unlimited'
    },
    driverStintTimeSec: {
      zh: '车手单次驾驶时间上限（秒）',
      en: 'Maximum driver stint time in seconds'
    },
    mandatoryPitstopCount: {
      zh: '强制进站次数',
      en: 'Mandatory pit stop count'
    },
    maxTotalDrivingTime: {
      zh: '总驾驶时间上限（秒）',
      en: 'Maximum total driving time in seconds'
    },
    maxDriversCount: {
      zh: '单车最多车手数量',
      en: 'Maximum number of drivers per car'
    },
    tyreSetCount: {
      zh: '可用轮胎套数',
      en: 'Number of available tire sets'
    },
    isRefuellingAllowedInRace: {
      zh: '允许比赛中加油',
      en: 'Allow refueling during race'
    },
    isRefuellingTimeFixed: {
      zh: '固定加油时间',
      en: 'Fixed refueling time'
    },
    isMandatoryPitstopRefuellingRequired: {
      zh: '强制进站时必须加油',
      en: 'Refueling required during mandatory pit stop'
    },
    isMandatoryPitstopTyreChangeRequired: {
      zh: '强制进站时必须换胎',
      en: 'Tire change required during mandatory pit stop'
    },
    isMandatoryPitstopSwapDriverRequired: {
      zh: '强制进站时必须换车手',
      en: 'Driver swap required during mandatory pit stop'
    }
  },
  assistRules: {
    disableIdealLine: {
      zh: '禁用理想路线辅助，0=启用，1=禁用',
      en: 'Disable ideal line assist, 0=enabled, 1=disabled'
    },
    disableAutosteer: {
      zh: '禁用自动转向辅助',
      en: 'Disable auto-steer assist'
    },
    stabilityControlLevelMax: {
      zh: '最大稳定控制级别（0-100）',
      en: 'Maximum stability control level (0-100)'
    },
    disableAutoPitLimiter: {
      zh: '禁用自动限速器',
      en: 'Disable automatic pit limiter'
    },
    disableAutoGear: {
      zh: '禁用自动换挡',
      en: 'Disable automatic gear shifting'
    },
    disableAutoClutch: {
      zh: '禁用自动离合',
      en: 'Disable automatic clutch'
    },
    disableAutoEngineStart: {
      zh: '禁用自动启动引擎',
      en: 'Disable automatic engine start'
    },
    disableAutoWiper: {
      zh: '禁用自动雨刷',
      en: 'Disable automatic wipers'
    },
    disableAutoLights: {
      zh: '禁用自动车灯',
      en: 'Disable automatic lights'
    }
  },
  entryList: {
    teamName: {
      zh: '车队名称',
      en: 'Team name'
    },
    raceNumber: {
      zh: '赛车编号',
      en: 'Car number'
    },
    defaultGridPosition: {
      zh: '默认发车位置',
      en: 'Default grid position'
    },
    ballastKg: {
      zh: '配重（千克）',
      en: 'Ballast in kg'
    },
    restrictor: {
      zh: '进气限制器（%）',
      en: 'Air restrictor percentage'
    },
    isServerAdmin: {
      zh: '设置为服务器管理员，0=否，1=是',
      en: 'Set as server administrator, 0=no, 1=yes'
    },
    forcedCarModel: {
      zh: '强制车辆型号，-1=自由选择',
      en: 'Forced car model, -1=free selection'
    },
    overrideCarModelForCustomCar: {
      zh: '覆盖自定义车的车辆型号',
      en: 'Override car model for custom car'
    },
    overrideDriverInfo: {
      zh: '覆盖车手信息',
      en: 'Override driver information'
    },
    customCar: {
      zh: '自定义车辆文件路径',
      en: 'Custom car file path'
    },
    driverCategory: {
      zh: '车手等级，0=白，1=铜，2=银，3=金，4=白金',
      en: 'Driver category, 0=white, 1=bronze, 2=silver, 3=gold, 4=platinum'
    },
    firstName: {
      zh: '车手名字',
      en: 'Driver first name'
    },
    lastName: {
      zh: '车手姓氏',
      en: 'Driver last name'
    },
    playerID: {
      zh: 'SteamID（entrylist 中为 S + 17 位数字，如 S76561198360984000）',
      en: 'SteamID (in entrylist: capital S + 17 digits, e.g. S76561198360984000)',
    },
    shortName: {
      zh: '车手简写名称',
      en: 'Driver short name'
    },
    nationality: {
      zh: '国籍代码',
      en: 'Nationality code'
    },
    forceEntryList: {
      zh: '强制使用参赛名单，0=否，1=是',
      en: 'Force entry list, 0=no, 1=yes'
    }
  },
  bop: {
    track: {
      zh: '赛道名称',
      en: 'Track name'
    },
    carModel: {
      zh: '车辆型号 ID',
      en: 'Car model ID'
    },
    ballastKg: {
      zh: '配重调整（千克）',
      en: 'Ballast adjustment in kg'
    },
    restrictor: {
      zh: '进气限制器调整（%）',
      en: 'Air restrictor adjustment percentage'
    }
  }
}
