# CSV 导入格式详解 (Entrylist CSV Guide)

[中文版](#1-表头字段说明) | [English](#1-header-field-descriptions)

---

## 中文版 (Chinese)

导入 CSV 时，请确保包含以下表头，并严格遵守字段要求。

### 1. 表头字段说明

| 字段名 (Header) | 说明 | 必填 | 备注 / 取值示例 |
| :--- | :--- | :--- | :--- |
| **playerID** | 车手的 SteamID64 | 是 | 17 位数字 (如 `7656119xxxxxxxxxx`) |
| **teamName** | 队伍名称 | 是 | **核心字段**：名称相同的车手会被自动编入同一辆赛车 |
| **raceNumber** | 赛车编号 | 否 | 1-999。若不填则由服务器分配 |
| **defaultGridPosition** | 初始发车顺位 | 否 | 整数。若不填则按服务器默认规则 |
| **firstName** | 名字 (First Name) | 否 | 字符串 |
| **lastName** | 姓氏 (Last Name) | 是 | 字符串 |
| **shortName** | 简称 (3位) | 否 | 3 位大写字母 (如 `ZHA`) |
| **overrideDriverInfo** | 是否覆盖玩家信息 | 是 | `1`: 覆盖 (使用此处填写的姓名/国家); `0`: 不覆盖 |
| **isServerAdmin** | 是否设为管理员 | 是 | `1`: 是; `0`: 否 |
| **nationality** | 国家/地区 ID | 是 | 请参考 [id_reference.md](id_reference.md) |
| **driverCategory** | 车手等级 | 是 | `0`: Bronze, `1`: Silver, `2`: Gold, `3`: Platinum |
| **forcedCarModel** | 强制车辆 ID | 是 | 请参考 [id_reference.md](id_reference.md) |
| **ballastKg** | 额外配重 (kg) | 否 | 0-100 之间的整数 |
| **restrictor** | 进气限制 (%) | 否 | 0-20 之间的整数 |

### 2. 自动编队逻辑
软件在导入时会扫描 `teamName`：
- 如果多行数据的 `teamName` 相同，它们将被视为**同一个车队**，所有成员将被分配到**同一辆车**（强制车辆 ID 和赛车编号将以该车队的第一行数据为准）。
- 最多支持 3 名车手共享一辆赛车（ACC 服务器限制）。

### 3. CSV 文件要求
- **编码**：建议使用 **UTF-8** 编码，以防止中文姓名出现乱码。
- **分隔符**：必须使用**英文半角逗号** (`,`)。

---

## English Version

Please ensure your CSV includes the following headers and adheres to the field requirements.

### 1. Header Field Descriptions

| Header | Description | Required | Notes / Examples |
| :--- | :--- | :--- | :--- |
| **playerID** | Driver's SteamID64 | Yes | 17-digit number (e.g., `7656119xxxxxxxxxx`) |
| **teamName** | Team Name | Yes | **Core Field**: Drivers with the same team name will be grouped into the same car. |
| **raceNumber** | Race Number | No | 1-999. Assigned by server if empty. |
| **defaultGridPosition** | Initial Grid Position | No | Integer. Follows server defaults if empty. |
| **firstName** | First Name | No | String (can be empty) |
| **lastName** | Last Name | Yes | String |
| **shortName** | Short Name (3 chars) | No | 3 uppercase letters (e.g., `DOE`) |
| **overrideDriverInfo** | Override Info | Yes | `1`: Yes (use CSV info); `0`: No (use Steam profile) |
| **isServerAdmin** | Set as Admin | Yes | `1`: Yes; `0`: No |
| **nationality** | Nationality ID | Yes | Refer to [id_reference.md](id_reference.md) |
| **driverCategory** | Driver Category | Yes | `0`: Bronze, `1`: Silver, `2`: Gold, `3`: Platinum |
| **forcedCarModel** | Forced Car Model ID | Yes | Refer to [id_reference.md](id_reference.md) |
| **ballastKg** | Ballast (kg) | No | Integer between 0-100. |
| **restrictor** | Restrictor (%) | No | Integer between 0-20. |

### 2. Auto-Grouping Logic
The software scans `teamName` during import:
- Rows with the **same teamName** are treated as a single team. All members will be assigned to the **same car**. (Car model and race number will follow the first entry of that team).
- Maximum of 3 drivers per car (ACC server limitation).

### 3. CSV Requirements
- **Encoding**: **UTF-8** is recommended to prevent character corruption.
- **Delimiter**: Must use a **comma** (`,`).

---

### 📋 示例数据 / Sample Data
```csv
playerID,teamName,raceNumber,defaultGridPosition,firstName,lastName,shortName,overrideDriverInfo,isServerAdmin,nationality,driverCategory,forcedCarModel,ballastKg,restrictor
76561199873811908,SpeedMaster,10,,San,Zhang,ZHA,1,0,35,0,30,0,0
76561199873811907,SpeedMaster,10,,Si,Li,LIS,1,0,35,0,30,0,0
76561199873811901,SoloRacer,22,,John,Doe,DOE,1,1,39,2,32,10,0
```

### 💡 小贴士 / Tips
- **Excel**: Edit in Excel and "Save As" `CSV (Comma delimited) (*.csv)`.
- **IDs**: Always use numeric IDs for `forcedCarModel` and `nationality`.
- **SteamID**: Use online lookup tools if you are unsure of a driver's SteamID64.
