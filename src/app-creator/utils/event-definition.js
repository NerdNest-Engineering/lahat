/**
 * @file event-definition.js
 * @description Defines the EventDefinition class for creating standardized event objects.
 */

export class EventDefinition {
  constructor(eventName, description, payloadSchema) {
    this.eventName = eventName;
    this.description = description;
    // Freeze payloadSchema if it's an object to prevent modification
    this.payloadSchema = (typeof payloadSchema === 'object' && payloadSchema !== null)
      ? Object.freeze(JSON.parse(JSON.stringify(payloadSchema))) // Deep freeze for simple objects
      : payloadSchema;
    Object.freeze(this);
  }

  toString() {
    return this.eventName;
  }

  valueOf() {
    return this.eventName;
  }
}
