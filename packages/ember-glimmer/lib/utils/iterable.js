import { get } from 'ember-metal/property_get';
import { guidFor } from 'ember-metal/utils';
import { objectAt, isEmberArray } from 'ember-runtime/mixins/array';
import { UpdatableReference } from './references';

export default function iterableFor(ref, keyPath) {
  return new Iterable(ref, keyFor(keyPath));
}

function keyFor(keyPath) {
  switch (keyPath) {
    case '@index':
      return index;
    case '@identity':
    case undefined:
    case null:
      return identity;
    default:
      return (item) => get(item, keyPath);
  }
}

function index(item, index) {
  return String(index);
}

function identity(item) {
  switch (typeof item) {
    case 'string':
    case 'number':
      return String(item);
    default:
      return guidFor(item);
  }
}

class ArrayIterator {
  constructor(array, keyFor) {
    this.array = array;
    this.length = array.length;
    this.keyFor = keyFor;
    this.position = 0;
  }

  isEmpty() {
    return false;
  }

  next() {
    let { array, length, keyFor, position } = this;

    if (position >= length) { return null; }

    let value = array[position];
    let key = keyFor(value, position);

    this.position++;

    return { key, value };
  }
}

class EmberArrayIterator {
  constructor(array, keyFor) {
    this.array = array;
    this.length = get(array, 'length');
    this.keyFor = keyFor;
    this.position = 0;
  }

  isEmpty() {
    return this.length === 0;
  }

  next() {
    let { array, length, keyFor, position } = this;

    if (position >= length) { return null; }

    let value = objectAt(array, position);
    let key = keyFor(value, position);

    this.position++;

    return { key, value };
  }
}

class EmptyIterator {
  isEmpty() {
    return true;
  }

  next() {
    throw new Error('Cannot call next() on an empty iterator');
  }
}

const EMPTY_ITERATOR = new EmptyIterator();

class Iterable {
  constructor(ref, keyFor) {
    this.ref = ref;
    this.keyFor = keyFor;
  }

  iterate() {
    let { ref, keyFor } = this;

    let iterable = ref.value();

    if (iterable === undefined || iterable === null) {
      return EMPTY_ITERATOR;
    } else if (Array.isArray(iterable)) {
      return iterable.length > 0 ? new ArrayIterator(iterable, keyFor) : EMPTY_ITERATOR;
    } else if (isEmberArray(iterable)) {
      return new EmberArrayIterator(iterable, keyFor);
    } else {
      throw new Error(`Don't know how to {{#each ${iterable}}}`);
    }
  }

  referenceFor(item) {
    return new UpdatableReference(item.value);
  }

  updateReference(reference, item) {
    reference.update(item.value);
  }
}
