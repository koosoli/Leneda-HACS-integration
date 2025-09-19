# Device Consolidation Explained

## How It Works

The Leneda integration automatically consolidates devices **WITHOUT requiring you to add meters multiple times**.

### Current Setup (What You Have)
- **One config entry** with one metering point ID  
- **One device** in Home Assistant UI
- **All sensors** grouped under that device

### What Consolidation Does
1. **Device Grouping**: If Leneda provides separate metering points for production/consumption of the same physical meter, they appear as one device
2. **Smart Naming**: Uses the consumption meter ID as the base for device naming
3. **No Duplicate Setup**: You still only configure once with your main metering point ID

### Example Pattern Recognition
```
Consumption Meter: LU0000010983800000000000070590176
Production Meter:  LU0000010983800000000000770590176
                                          ^ Only difference
Device Name: "Leneda (...0176)" (using consumption ID)
```

### What You Need To Do
**Nothing different!** 
- Keep your current single integration setup
- The consolidation works automatically based on ID patterns
- If you have separate production/consumption meters in Leneda's system, they'll be grouped properly

### If You Have Multiple Physical Meters
Only then would you add multiple config entries - one per physical location/meter.

## Troubleshooting

### "Unknown" Sensors
If sensors show "Unknown" instead of 0.00:
- This is normal on first startup
- Should resolve after first successful API call
- If persistent, check network connectivity to api.leneda.eu

### Duplicate Devices
If you see duplicate devices:
- Remove and re-add the integration
- The new consolidation logic will group them properly