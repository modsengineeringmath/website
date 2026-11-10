---
title: "Thailand Electricity Bill Calculator (MEA and PEA): Every Customer Category, Rates from September 2026"
url: https://modsengineeringmath.com/en/tools/electricity-bill-calculator/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-10
---

> Calculate a Thai electricity bill online, free, at the actual MEA and PEA rates for all 8 categories: the new residential tariff (first 200 units at 3 baht), TOU, small, medium and large business, demand charge, power factor charge, Ft at 16.23 satang and 7% VAT, itemised line by line.

Markdown copy of https://modsengineeringmath.com/en/tools/electricity-bill-calculator/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Thailand Electricity Bill Calculator (MEA and PEA): Every Customer Category, Rates from September 2026

THภาษาไทยENEnglish
// Tool · Electricity Bill Calculator


Choose the utility, customer category and voltage level, enter the units (and kW for businesses), and get a line-by-line calculation in the same order as a real bill: stepped energy charge, demand charge, power factor charge, service charge, Ft and VAT.

## Calculator

This calculator needs JavaScript.

## How a Thai electricity bill is built

$$\text{Bill} = \left(\text{base tariff} + \text{Ft}\right) \times 1.07$$

- Base tariff = energy charge (baht per unit) + demand charge (baht per kW, medium businesses and above) + power factor charge (if any) + monthly service charge.

- Ft (the automatic fuel adjustment) = units × the Ft rate, which the Energy Regulatory Commission (ERC) announces every four months. For September–December 2026 it is 16.23 satang per unit.

- VAT of 7 % applies to the base tariff plus Ft.

One unit is one kilowatt-hour (kWh): 1,000 watts used for one hour.

## Residential rates (bills from September 2026)

| Units | Rate 1.1 (PEA 1.1.1)
up to 150 units/month | Rate 1.2 (PEA 1.1.2)
over 150 units/month |

| 1–15 | 2.3488 | 3.0000 |

| 16–25 | 2.9882 |

| 26–200 | 3.0000 |

| 201–400 | 4.1584 | 4.1584 |

| 401 and above | 4.3583 | 4.3583 |

| Service charge (baht/month) | 8.19 | 24.62 |

Residential TOU (MEA 1.3 / PEA 1.2) at low voltage: On-Peak 5.7982 baht and Off-Peak 2.6369 baht per unit, service charge 24.62 baht a month. On-Peak is Monday to Friday, 09:00–22:00. All other hours, weekends and regular public holidays (not substitute holidays) are Off-Peak.

## Example: a home using 350 units on rate 1.2

| Item | Calculation | Baht |

| First 200 units | 200 × 3.0000 | 600.00 |

| Units 201–350 | 150 × 4.1584 | 623.76 |

| Service charge | | 24.62 |

| Base tariff subtotal | | 1,248.38 |

| Ft | 350 × 0.1623 | 56.81 |

| VAT 7 % | (1,248.38 + 56.81) × 0.07 | 91.36 |

| Total payable | | 1,396.55 |

That is an average of 3.99 baht per unit once the service charge, Ft and VAT are included.

## Business categories

| Category | Who | Rate structure |

| 2 Small general service | Demand below 30 kW | Stepped energy charge (low voltage 3.2484 / 4.2218 / 4.4217) or TOU; service 33.29 baht |

| 3 Medium general service | 30–999 kW and up to 250,000 units/month | Demand charge + energy charge (normal or TOU); service 312.24 baht |

| 4 Large general service | 1,000 kW and above, or over 250,000 units/month | TOD (Peak / Partial) or TOU |

| 5 Specific business | Hotels and rental accommodation from 30 kW | TOU |

| 6 Non-profit organisation | Non-government organisations | Normal or TOU |

| 7 Agricultural pumping | Government units, cooperatives, farmer groups | First 100 units 2.0889, the rest 3.2405, or TOU |

| 8 Temporary supply | Construction sites, temporary events | 6.8025 baht per unit at every voltage |

Customers billed on demand have two further rules: a minimum charge of 70 % of the highest demand charge in the previous 12 months, and a power factor charge of 56.07 baht per kvar above 61.97 % of the maximum kW. See the power factor calculator for how to correct it.

## Where the rates come from, and limits

The rates come from the Provincial Electricity Authority's tariff schedule (effective for September 2026 bills), the Metropolitan Electricity Authority's tariff pages and the ERC's Ft announcement, last compared on 10 November 2026. MEA and PEA charge the same rates; only the category numbering and the voltage bands differ.

The result is an estimate for planning. A real bill can differ slightly because of satang rounding, government relief measures, the number of days in the billing cycle and penalties. When the ERC announces a new Ft, you can type it into the Ft box yourself until the site is updated.

## Learn the theory

- Power factor calculator

- What is power factor?

- Solar PV design calculators (in Thai)

- Home EV charging (in Thai)

## Frequently asked questions

How much is electricity per unit in Thailand in 2026?
For homes, from September 2026 bills: the first 200 units cost at most 3.00 baht each, units 201–400 cost 4.1584 baht, and units from 401 cost 4.3583 baht. Add the service charge, Ft of 16.23 satang per unit and 7% VAT.

What is Ft?
The automatic tariff adjustment. It moves the price to reflect fuel and power-purchase costs that differ from those assumed in the base tariff. The ERC reviews it every four months and it is the same for every unit.

When is TOU cheaper than the normal rate?
When most use falls in Off-Peak hours: nights from 22:00 to 09:00 and weekends, for example a home that charges an electric car overnight. Enter both On-Peak and Off-Peak units and the calculator compares the two rates.

Do MEA and PEA charge different prices?
No. The per-unit rates are the same nationwide. The category numbers differ (MEA 1.2 is PEA 1.1.2) and so do the voltage bands (MEA 12–24 kV, PEA 22–33 kV).

How do I estimate units from appliances?
Units = watts × hours ÷ 1,000. A 900 W air conditioner running 8 hours a day for 30 days uses 900 × 8 × 30 ÷ 1,000 = 216 units. The appliance table under the calculator adds up a whole home.

## More calculators

LaTeX equation editor (PNG / SVG)
Laplace transform calculator
Inverse Laplace transform calculator
Fourier series calculator
Derivative calculator
Integral calculator
Area calculator
Power factor calculator
All tools →

## Frequently asked questions

**How much is electricity per unit in Thailand in 2026?**
For homes, from September 2026 bills: the first 200 units cost at most 3.00 baht each, units 201–400 cost 4.1584 baht, and units from 401 cost 4.3583 baht. Add the service charge, Ft of 16.23 satang per unit and 7% VAT.

**What is Ft?**
The automatic tariff adjustment. It moves the price to reflect fuel and power-purchase costs that differ from those assumed in the base tariff. The ERC reviews it every four months and it is the same for every unit.

**When is TOU cheaper than the normal rate?**
When most use falls in Off-Peak hours: nights from 22:00 to 09:00 and weekends, for example a home that charges an electric car overnight. Enter both On-Peak and Off-Peak units and the calculator compares the two rates.

**Do MEA and PEA charge different prices?**
No. The per-unit rates are the same nationwide. The category numbers differ (MEA 1.2 is PEA 1.1.2) and so do the voltage bands (MEA 12–24 kV, PEA 22–33 kV).

**How do I estimate units from appliances?**
Units = watts × hours ÷ 1,000. A 900 W air conditioner running 8 hours a day for 30 days uses 900 × 8 × 30 ÷ 1,000 = 216 units. The appliance table under the calculator adds up a whole home.
