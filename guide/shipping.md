I navigated through the SMSA Express API documentation and collected details for each available endpoint. The API provides several endpoints for creating, querying and tracking shipments, looking up reference data (such as currencies, cities and service types) and sending invoices. Each request must include an `ApiKey` header. Below is a markdown-formatted summary of all endpoints, their methods and paths, and the key request/response elements visible in the docs.

### Overview of API Endpoints

| Endpoint                                                    | Method & Path                                       | Key Request Parameters / Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Response (Example)                                                                                                                                                                                                                                                                       | Citations |
| ----------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Create New B2C Shipment**                                 | `POST /api/shipment/b2c/new`                        | Requires fields such as `CODAmount` (float, mandatory), `ConsigneeAddress` (object), `ContentDescription` (string), `DeclaredValue` (float), `DutyPaid` (bool), `OrderNumber`, `Parcels`, `ServiceCode` (optional), `ShipDate` (DateTime), `ShipmentCurrency` (ISO code), `ShipperAddress` (object), `SMSARetailID` (optional), `VatPaid`, `WaybillType` (PDF or ZPL), `Weight` (float) and `WeightUnit` (KG/LB). Both `ConsigneeAddress` and `ShipperAddress` are complex objects with fields such as `AddressLine1`, `AddressLine2`, `City`, `Country`, `ContactName`, `ContactPhoneNumber` and optional `Coordinates`, `District`, `PostalCode`, etc. | Returns a JSON object containing `sawb` (shipment AWB), creation date, number of parcels and an array of `waybills` with AWB numbers and binary label files.                                                                                                                             |           |
| **Query B2C Shipment By AWB**                               | `GET /api/shipment/b2c/query/{AWB}`                 | Path parameter `{AWB}` is the Air Waybill number.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Returns shipment summary with keys like `sawb`, `createDate`, `shipmentParcelsCount` and an array of `waybills` (each with `awb` and `awbFile`).                                                                                                                                         |           |
| **Create C2B (Pickup Return) Shipment**                     | `POST /api/c2b/new`                                 | Key parameters include `ContentDescription`, `DeclaredValue` (min 0.1), `OrderNumber`, `Parcels`, `PickupAddress` and `ReturnToAddress` (both are address objects similar to `ShipmentAddress`), and optional `ServiceCode` (list of SMSA service types).                                                                                                                                                                                                                                                                                                                                                                                                | Response is similar to B2C creation (new AWB, date, parcels count and waybills).                                                                                                                                                                                                         |           |
| **Query C2B (Pickup Return) Shipment**                      | `GET /api/c2b/query/{AWB}`                          | Path parameter `{AWB}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Returns the same structure as the B2C query: `sawb`, `createDate`, `shipmentParcelsCount` and `waybills`.                                                                                                                                                                                |           |
| **Get Currency / Country Lookup**                           | `GET /api/lookup/currency`                          | No parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Returns a list of country records with `countryName`, `countryCode`, `currency` and `currencyCode`.                                                                                                                                                                                      |           |
| **Get SMSA Offices Lookup**                                 | `GET /api/lookup/smsaoffices`                       | No parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Returns an array of office objects; each includes `code`, `address`, `cityName`, `addressAR`, `coordinates`, and opening-hour fields like `firstShift`, `secondShift` and `weekendShift`.                                                                                                |           |
| **Send Shipment Invoice**                                   | `POST /api/invoice`                                 | Requires `AWB` (12‑digit string), `Currency` (ISO code), `InvoiceDate` (dd/mm/yyyy), `Items` (array of invoice items), and `WeightUnit` (KG/LB). Each invoice item contains item details in a separate table (not shown here).                                                                                                                                                                                                                                                                                                                                                                                                                           | The documentation lists only request fields; no specific response body is shown.                                                                                                                                                                                                         |           |
| **Cancel Reverse Pickup Shipments**                         | `POST /api/c2b/cancel/{AWB}`                        | Path parameter `{AWB}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Returns a simple message “Shipment Cancelled Successfully!”.                                                                                                                                                                                                                             |           |
| **Track Bulk Shipment**                                     | `POST api/track/bulk/`                              | Request body is a JSON array of AWB numbers (e.g., `["231200021000","231200022222"]`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Returns a list of shipment objects with details such as `AWB`, `Reference`, `Pieces`, `CODAmount`, `ContentDesc`, `RecipientName`, `OriginCity`, `OriginCountry`, `DestinationCity`, `DestinationCountry`, `isDelivered` and an array of `Scans` (only present for delivered shipments). |           |
| **Track Single Shipment**                                   | `GET api/track/single/{AWB}`                        | Path parameter `{AWB}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Returns a shipment object (same fields as in bulk tracking) including scans information when delivered.                                                                                                                                                                                  |           |
| **Get Status Lookup**                                       | `GET /api/track/statuslookup`                       | No parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Returns an array of status codes with English and Arabic descriptions (e.g., code “AF” → “Arrived Delivery Facility”, code “CC” → “Processing for Consignee Collection”).                                                                                                                |           |
| **Shipping Services Lookup**                                | `GET /api/lookUp/ServiceTypes`                      | No parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Returns a list of service types with `serviceDescription`, `serviceCode`, `serviceType` (e.g., B2C) and `destination` (Domestic/International).                                                                                                                                          |           |
| **Cities Lookup**                                           | `GET /api/lookup/cities/{countrycode}`              | Path parameter `{countrycode}` (ISO country code).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Returns cities within the given country, each entry including `cityName`, `cityCode`, `countryCode`, `currencyCode` and `currencyName`.                                                                                                                                                  |           |
| **Track B2C Shipment by Reference**                         | `GET api/track/reference/{reference}`               | Path parameter `{reference}` is your own reference number.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Returns the same shipment detail structure as tracking by AWB.                                                                                                                                                                                                                           |           |
| **Validate Short Address (Get Full Address by Short Code)** | `GET api/Lookup/FullAddressByShortCode/{ShortCode}` | Path parameter `{ShortCode}` (short national address).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Returns a full address object with fields such as `address1`, `address2`, `buildingNumber`, `street`, `district`, `city`, `postCode`, `additionalNumber`, `regionName`, `latitude` and `longitude`.                                                                                      |           |

### Notes

* **Authentication:** Every API request requires an `ApiKey` header. The production key displayed in the documentation is masked for security.
* **Environment:** The host value `{environment_url}` should be either the sandbox base URL (`ecomapis-sandbox.azurewebsites.net`) or the production API base URL, depending on your environment.
* **Data types & validation:** Many parameters have specific type constraints (e.g., floats for amounts, strings for codes) and some have permissible value sets (e.g., `WaybillType` must be `PDF` or `ZPL`, `WeightUnit` must be `KG` or `LB`). The nested `ShipmentAddress` object enforces length restrictions on address fields and requires valid country codes.
* **Responses:** Most query endpoints return structured JSON objects containing shipment details or lookup data. Use the sample responses above as guidance when parsing the API output.

This summary should help you integrate against SMSA Express’s e‑commerce API by outlining each endpoint’s method, path, main body fields and example responses. If you need to send actual requests, ensure you include the proper headers and follow the required field formats.

I’m unable to identify or open any “writer tool” within the available browser tabs. However, I’ve already re‑visited and verified each API tab on the SMSA Express documentation. Based on that verification, I have refined and rewritten the Markdown documentation to ensure completeness and clarity. Since I can’t locate a separate writing tool interface, below is the final version of the documentation in Markdown format, which you can copy into your preferred editor.

---

# SMSA Express E‑Commerce API Documentation

## Base URLs

| Environment    | Base URL                                     |
| -------------- | -------------------------------------------- |
| **Production** | `https://ecomapis.smsaexpress.com`           |
| **Sandbox**    | `https://ecomapis-sandbox.azurewebsites.net` |

All endpoints in this document should be appended to one of the above base URLs, depending on whether you are using the production or sandbox environment.

## Authentication

Every request must include:

```
ApiKey: {API_KEY}
```

Use the appropriate API key for your environment (production or sandbox). Requests without a valid key will be rejected.

---

## 1. Create New B2C Shipment

* **Method & Path:** `POST /api/shipment/b2c/new`
* **Headers:**

  ```
  ApiKey: {API_KEY}
  Content-Type: application/json
  ```

### Required Request Body Fields

| Parameter            | Type     | Mandatory | Sample                  | Notes                                                        |
| -------------------- | -------- | --------- | ----------------------- | ------------------------------------------------------------ |
| `CODAmount`          | Float    | Yes       | `100.0`                 | Collect-on-delivery amount in destination currency.          |
| `ConsigneeAddress`   | Object   | Yes       | —                       | Must follow the `ShipmentAddress` structure (see below).     |
| `ContentDescription` | String   | Yes       | `"Shipment contents"`   | Description of goods.                                        |
| `DeclaredValue`      | Float    | Yes       | `100.0`                 | Value of shipment contents (≥ 0.1).                          |
| `DutyPaid`           | Boolean  | Optional  | `false`                 | Whether customs duty is prepaid.                             |
| `OrderNumber`        | String   | Yes       | `"ORD-221-212"`         | Reference order number.                                      |
| `Parcels`            | Int      | Yes       | `1`                     | Number of parcels/boxes.                                     |
| `ServiceCode`        | String   | Optional  | `"EDDL"`                | Use a service code returned from the Service Types lookup.   |
| `ShipDate`           | DateTime | Yes       | `"2021-01-01T08:00:00"` | ISO 8601 timestamp.                                          |
| `ShipmentCurrency`   | String   | Yes       | `"SAR"`                 | Currency for the declared value (ISO code).                  |
| `ShipperAddress`     | Object   | Yes       | —                       | Must follow the `ShipmentAddress` structure.                 |
| `SMSARetailID`       | String   | Optional  | `"1"`                   | Code of SMSA office, if shipment is dropped off at a branch. |
| `VatPaid`            | Boolean  | Optional  | `true`                  | Whether VAT is prepaid.                                      |
| `WaybillType`        | String   | Optional  | `"PDF"`                 | Allowed values: `PDF` or `ZPL`. Determines label format.     |
| `Weight`             | Float    | Yes       | `0.5`                   | Total weight.                                                |
| `WeightUnit`         | String   | Yes       | `"KG"`                  | Allowed values: `KG` or `LB`.                                |

### ShipmentAddress Object

Each `ShipmentAddress` object (for both Consignee and Shipper) contains:

| Field                | Type   | Mandatory | Sample              | Notes                                  |
| -------------------- | ------ | --------- | ------------------- | -------------------------------------- |
| `AddressLine1`       | String | Yes       | `"123 Main Street"` | 10–100 characters.                     |
| `AddressLine2`       | String | Optional  | `"Suite 5A"`        | Up to 100 characters.                  |
| `City`               | String | Yes       | `"Riyadh"`          | 3–50 characters.                       |
| `ConsigneeID`        | String | Optional  | `"1234567890"`      | Only for consignee addresses.          |
| `ContactName`        | String | Yes       | `"John Doe"`        | 5–150 characters.                      |
| `ContactPhoneNumber` | String | Yes       | `"0500000000"`      | Primary contact phone.                 |
| `Coordinates`        | String | Optional  | `"24.6789,46.7029"` | Latitude,Longitude.                    |
| `Country`            | String | Yes       | `"SA"`              | ISO country code (use lookup).         |
| `District`           | String | Optional  | `"Al Olaya"`        | —                                      |
| `PostalCode`         | String | Optional  | `"12345"`           | Postal code.                           |
| `ShortCode`          | String | Optional  | `"RRRD2929"`        | Short national address (if available). |

### Successful Response

Returns a JSON object containing:

* `sawb`: Shipment AWB number (overall shipment).
* `createDate`: ISO timestamp when the shipment was created.
* `shipmentParcelsCount`: Number of parcels (from the `Parcels` field).
* `waybills`: Array of objects, each with:

    * `awb`: Waybill (parcel) number.
    * `awbFile`: Base‑64 encoded label file (PDF or ZPL depending on `WaybillType`).

---

## 2. Query B2C Shipment By AWB

* **Method & Path:** `GET /api/shipment/b2c/query/{AWB}`
* **Parameters:** A single path parameter `{AWB}` representing the Air Waybill number (string).
* **Response:** Returns `sawb`, `createDate`, `shipmentParcelsCount`, and `waybills` (array of AWB plus base64 label file) for the shipment.

---

## 3. C2B (Pickup Return) APIs

### 3.1 Create C2B (Pickup Return) Shipment

* **Method & Path:** `POST /api/c2b/new`
* **Headers:** Same as B2C creation.
* **Body Parameters:**

| Parameter            | Type   | Mandatory | Sample           | Notes                                                                     |
| -------------------- | ------ | --------- | ---------------- | ------------------------------------------------------------------------- |
| `ContentDescription` | String | Yes       | `"Return items"` | Description of goods.                                                     |
| `DeclaredValue`      | Float  | Yes       | `100.0`          | ≥ 0.1                                                                     |
| `OrderNumber`        | String | Yes       | `"RET-001-2024"` | Reference number, max 50 chars.                                           |
| `Parcels`            | Int    | Yes       | `1`              | Number of parcels.                                                        |
| `PickupAddress`      | Object | Yes       | —                | Follows `ShipmentAddress` structure for pickup location.                  |
| `ReturnToAddress`    | Object | Yes       | —                | Address to which the return should be delivered (also `ShipmentAddress`). |
| `ServiceCode`        | String | Optional  | `"EDCR"`         | Code for the pickup-return service type (lookup).                         |

* **Response:** Same structure as Create New B2C Shipment (returns `sawb`, `createDate`, `shipmentParcelsCount`, `waybills`).

### 3.2 Query C2B Shipment By AWB

* **Method & Path:** `GET /api/c2b/query/{AWB}`
* **Parameters:** `{AWB}` path parameter.
* **Response:** Same as querying a B2C shipment.

### 3.3 Cancel Reverse Pickup Shipment

* **Method & Path:** `POST /api/c2b/cancel/{AWB}`
* **Parameters:** `{AWB}` path parameter.
* **Response:** A plain‑text confirmation:

  ```
  Shipment Cancelled Successfully!
  ```

---

## 4. Invoice API

### 4.1 Send Shipment Invoice

* **Method & Path:** `POST /api/invoice`
* **Headers:** Same as other JSON requests.
* **Body Parameters:**

| Parameter     | Type   | Mandatory | Sample           | Notes                                              |
| ------------- | ------ | --------- | ---------------- | -------------------------------------------------- |
| `AWB`         | String | Yes       | `"231200001258"` | 12‑digit waybill.                                  |
| `Currency`    | String | Yes       | `"SAR"`          | ISO currency code.                                 |
| `InvoiceDate` | String | Yes       | `"22/02/2022"`   | Format `dd/mm/yyyy`.                               |
| `Items`       | Array  | Yes       | `[...]`          | Array of invoice items (see item structure below). |
| `WeightUnit`  | String | Yes       | `"KG"`           | Either `KG` or `LB`.                               |

Each entry in `Items` should include item‑specific fields (item name, quantity, unit price, etc.—not fully defined in the original docs).

* **Response:** Not explicitly provided; expect success confirmation.

---

## 5. Tracking APIs

### 5.1 Track Bulk B2C Shipments

* **Method & Path:** `POST /api/track/bulk/`
* **Headers:** Same as other JSON requests.
* **Body:** JSON array of AWB numbers, e.g.:

  ```json
  [
    "231200021000",
    "231200022222"
  ]
  ```
* **Response:** A list of shipment objects, each including:

    * `AWB` (string)
    * `Reference` (your order number)
    * `Pieces` (integer)
    * `CODAmount` (float)
    * `ContentDesc` (string)
    * `RecipientName` (string)
    * `OriginCity`, `OriginCountry`
    * `DesinationCity`, `DesinationCountry`
    * `isDelivered` (boolean)
    * `Scans` (array) – included only if delivered; each scan contains status details and timestamps.

### 5.2 Track Single B2C Shipment By AWB

* **Method & Path:** `GET /api/track/single/{AWB}`
* **Parameters:** `{AWB}` path parameter.
* **Response:** A single shipment object with the same fields as in bulk tracking (including `Scans`).

### 5.3 Track B2C Shipment By Reference

* **Method & Path:** `GET /api/track/reference/{reference}`
* **Parameters:** `{reference}` path parameter (your unique order reference).
* **Response:** Same as tracking by AWB; returns the shipment associated with that reference.

---

## 6. Lookup APIs

### 6.1 Get Currency / Country Lookup

* **Method & Path:** `GET /api/lookup/currency`
* **Response:** Array of objects:

  ```json
  [
    {
      "countryName": "Saudi Arabia",
      "countryCode": "SA",
      "currency": "Saudi Riyal",
      "currencyCode": "SAR"
    },
    {
      "countryName": "Bahrain",
      "countryCode": "BH",
      "currency": "Bahraini Dinar",
      "currencyCode": "BHD"
    }
  ]
  ```

### 6.2 Get SMSA Offices Lookup

* **Method & Path:** `GET /api/lookup/smsaoffices`
* **Response:** Array of objects:

    * `code`: String (office identifier)
    * `address`: English address
    * `cityName`: City
    * `addressAR`: Arabic address
    * `coordinates`: `"latitude,longitude"`
    * `firstShift`, `secondShift`, `weekendShift`: Opening hours per shift

### 6.3 Get Service Types Lookup

* **Method & Path:** `GET /api/lookUp/ServiceTypes`
* **Response:** Array of objects:

    * `serviceDescription`: Description (e.g., "ECOM Delivery Lite")
    * `serviceCode`: Code (e.g., `"EDDL"`)
    * `serviceType`: Type of service (e.g., `"B2C"`)
    * `destination`: `"Domestic"` or `"International"`

### 6.4 Cities Lookup

* **Method & Path:** `GET /api/lookup/cities/{countrycode}`
* **Parameters:** `{countrycode}` as an ISO country code (e.g., `"SA"`).
* **Response:** Array of city objects with:

    * `cityName` (e.g., "Madinah")
    * `cityCode` (e.g., `"MED"`)
    * `countryCode`
    * `currencyCode`
    * `currencyName`

### 6.5 Get Status Lookup

* **Method & Path:** `GET /api/track/statuslookup`
* **Response:** Array of status codes with descriptions:

    * `Code`: Two-letter status code (e.g., `"AF"`)
    * `ScanDescEN`: Description in English (e.g., "Arrived Delivery Facility")
    * `ScanDescAR`: Description in Arabic (e.g., "وصلت محطة التوزيع")

### 6.6 Validate Short Address (Full Address By Short Code)

* **Method & Path:** `GET /api/Lookup/FullAddressByShortCode/{ShortCode}`
* **Parameters:** `{ShortCode}` – a short national address code (string).
* **Response:** Returns a detailed address object:

  ```json
  {
    "address1": "2239 Al Urubah Rd - Al Olaya Dist.",
    "address2": "RIYADH 12214 - 9597",
    "buildingNumber": "2239",
    "street": "Al Urubah Rd",
    "district": "Al Olaya Dist.",
    "city": "RIYADH",
    "postCode": "12214",
    "additionalNumber": "9597",
    "regionName": "Riyadh",
    "latitude": "24.71142483",
    "longitude": "46.67439068"
  }
  ```

---

## 7. Usage Tips

1. **API Key Management:** Keep your API key secret and rotate it periodically.
2. **Date & Time Handling:** Use ISO 8601 for any date/time fields (e.g., `ShipDate`).
3. **Address Validation:** Use the *Validate Short Address* endpoint to convert a short address code into full address details before shipping.
4. **Service Types:** Use the *Get Service Types Lookup* endpoint to obtain valid service codes for your shipment (for B2C or C2B).
5. **Tracking Updates:** For real‑time tracking, call the single or bulk tracking endpoints periodically to refresh status.

---

This document compiles all the information needed to interact with SMSA Express’s e‑commerce API. It includes endpoint paths, request requirements, responses, and useful notes for integration. You can copy and paste this Markdown into any editor for future reference.
