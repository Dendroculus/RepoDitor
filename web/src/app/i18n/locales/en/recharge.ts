export const rechargeEn = {
  unavailable: "Recharge unavailable",
  unavailableMessage: "Recharge editing is unavailable for this Run save.",
  invalidInt32: "Stored charge data is not a valid signed Int32 integer.",
  eyebrow: "Truck inventory",
  title: "Recharge",
  supported: {
    one: "{count} supported rechargeable item",
    other: "{count} supported rechargeable items",
  },
  empty: "No supported rechargeable items were found in this Run save.",
  complete: "All supported items fully charged.",
  needed: { one: "{count} item needs recharging", other: "{count} items need recharging" },
  preservation: "Unknown and unsupported item types remain unchanged.",
  action: "Recharge All Supported Items",
} as const;
