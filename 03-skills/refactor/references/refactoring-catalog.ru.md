# Каталог рефакторингов

Подобранный каталог техник рефакторинга из книги Мартина Фаулера *«Рефакторинг»* (2-е издание). Каждый рефакторинг включает мотивацию, пошаговую механику и примеры.

> «Рефакторинг определяется его механикой — точной последовательностью шагов, которым вы следуете для выполнения изменения.» — Мартин Фаулер

---

## Как использовать этот каталог

1. **Определите запах** с помощью справочника по запахам кода
2. **Найдите соответствующий рефакторинг** в этом каталоге
3. **Следуйте механике** шаг за шагом
4. **Тестируйте после каждого шага**, чтобы убедиться в сохранении поведения

**Золотое правило**: Если любой шаг занимает более 10 минут, разбейте его на более мелкие шаги.

---

## Наиболее распространённые рефакторинги

### Извлечение метода

**Когда применять**: Длинный метод, дублированный код, необходимость назвать концепцию

**Мотивация**: Превратить фрагмент кода в метод, имя которого объясняет цель.

**Механика**:
1. Создать новый метод, названный по тому, что он делает (а не как)
2. Скопировать фрагмент кода в новый метод
3. Просмотреть локальные переменные, используемые во фрагменте
4. Передать локальные переменные как параметры (или объявить в методе)
5. Обработать возвращаемые значения соответствующим образом
6. Заменить исходный фрагмент вызовом нового метода
7. Протестировать

**До**:
```javascript
function printOwing(invoice) {
  let outstanding = 0;

  console.log("***********************");
  console.log("**** Задолженность ****");
  console.log("***********************");

  // Вычислить задолженность
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }

  // Вывести детали
  console.log(`имя: ${invoice.customer}`);
  console.log(`сумма: ${outstanding}`);
}
```

**После**:
```javascript
function printOwing(invoice) {
  printBanner();
  const outstanding = calculateOutstanding(invoice);
  printDetails(invoice, outstanding);
}

function printBanner() {
  console.log("***********************");
  console.log("**** Задолженность ****");
  console.log("***********************");
}

function calculateOutstanding(invoice) {
  return invoice.orders.reduce((sum, order) => sum + order.amount, 0);
}

function printDetails(invoice, outstanding) {
  console.log(`имя: ${invoice.customer}`);
  console.log(`сумма: ${outstanding}`);
}
```

---

### Встраивание метода

**Когда применять**: Тело метода не менее понятно, чем его имя; избыточное делегирование

**Мотивация**: Устранить ненужную косвенность, когда метод не добавляет ценности.

**Механика**:
1. Убедиться, что метод не является полиморфным
2. Найти все вызовы метода
3. Заменить каждый вызов телом метода
4. Тестировать после каждой замены
5. Удалить определение метода

**До**:
```javascript
function getRating(driver) {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(driver) {
  return driver.numberOfLateDeliveries > 5;
}
```

**После**:
```javascript
function getRating(driver) {
  return driver.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

---

### Извлечение переменной

**Когда применять**: Сложное выражение, которое трудно понять

**Мотивация**: Дать имя части сложного выражения.

**Механика**:
1. Убедиться, что выражение не имеет побочных эффектов
2. Объявить неизменяемую переменную
3. Присвоить ей результат выражения (или его части)
4. Заменить исходное выражение переменной
5. Протестировать

**До**:
```javascript
return order.quantity * order.itemPrice -
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
  Math.min(order.quantity * order.itemPrice * 0.1, 100);
```

**После**:
```javascript
const basePrice = order.quantity * order.itemPrice;
const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
const shipping = Math.min(basePrice * 0.1, 100);
return basePrice - quantityDiscount + shipping;
```

---

### Встраивание переменной

**Когда применять**: Имя переменной не сообщает больше, чем выражение

**Мотивация**: Устранить ненужную косвенность.

**Механика**:
1. Убедиться, что правая часть не имеет побочных эффектов
2. Если переменная не является неизменяемой — сделать её таковой и протестировать
3. Найти первую ссылку и заменить на выражение
4. Протестировать
5. Повторить для всех ссылок
6. Удалить объявление и присваивание
7. Протестировать

---

### Переименование переменной

**Когда применять**: Имя не ясно передаёт назначение

**Мотивация**: Хорошие имена критически важны для чистого кода.

**Механика**:
1. При широком использовании переменной — рассмотреть инкапсуляцию
2. Найти все ссылки
3. Изменить каждую ссылку
4. Протестировать

**Советы**:
- Использовать имена, раскрывающие намерение
- Избегать сокращений
- Использовать доменную терминологию

```javascript
// Плохо
const d = 30;
const x = users.filter(u => u.a);

// Хорошо
const daysSinceLastLogin = 30;
const activeUsers = users.filter(user => user.isActive);
```

---

### Изменение объявления функции

**Когда применять**: Имя функции не объясняет назначение, нужно изменить параметры

**Мотивация**: Хорошие имена функций делают код самодокументирующимся.

**Механика (простая)**:
1. Удалить ненужные параметры
2. Изменить имя
3. Добавить нужные параметры
4. Протестировать

**Механика (миграция — для сложных изменений)**:
1. Если удаляем параметр — убедиться, что он не используется
2. Создать новую функцию с нужным объявлением
3. Старая функция вызывает новую
4. Протестировать
5. Переключить вызывающих на новую функцию
6. Тестировать после каждого
7. Удалить старую функцию

**До**:
```javascript
function circum(radius) {
  return 2 * Math.PI * radius;
}
```

**После**:
```javascript
function circumference(radius) {
  return 2 * Math.PI * radius;
}
```

---

### Инкапсуляция переменной

**Когда применять**: Прямой доступ к данным из нескольких мест

**Мотивация**: Обеспечить чёткую точку доступа для манипуляции данными.

**Механика**:
1. Создать функции геттер и сеттер
2. Найти все ссылки
3. Заменить чтения геттером
4. Заменить записи сеттером
5. Тестировать после каждого изменения
6. Ограничить видимость переменной

**До**:
```javascript
let defaultOwner = { firstName: "Martin", lastName: "Fowler" };

// Используется во многих местах
spaceship.owner = defaultOwner;
```

**После**:
```javascript
let defaultOwnerData = { firstName: "Martin", lastName: "Fowler" };

function defaultOwner() { return defaultOwnerData; }
function setDefaultOwner(arg) { defaultOwnerData = arg; }

spaceship.owner = defaultOwner();
```

---

### Введение объекта-параметра

**Когда применять**: Несколько параметров, которые часто встречаются вместе

**Мотивация**: Сгруппировать данные, которые естественным образом принадлежат вместе.

**Механика**:
1. Создать новый класс/структуру для сгруппированных параметров
2. Протестировать
3. Использовать Изменение объявления функции для добавления нового объекта
4. Протестировать
5. Для каждого параметра в группе — удалить из функции и использовать новый объект
6. Тестировать после каждого

**До**:
```javascript
function amountInvoiced(startDate, endDate) { ... }
function amountReceived(startDate, endDate) { ... }
function amountOverdue(startDate, endDate) { ... }
```

**После**:
```javascript
class DateRange {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

function amountInvoiced(dateRange) { ... }
function amountReceived(dateRange) { ... }
function amountOverdue(dateRange) { ... }
```

---

### Объединение функций в класс

**Когда применять**: Несколько функций работают с одними и теми же данными

**Мотивация**: Сгруппировать функции с данными, которыми они оперируют.

**Механика**:
1. Применить Инкапсуляцию записи к общим данным
2. Переместить каждую функцию в класс
3. Тестировать после каждого перемещения
4. Заменить аргументы данных использованием полей класса

**До**:
```javascript
function base(reading) { ... }
function taxableCharge(reading) { ... }
function calculateBaseCharge(reading) { ... }
```

**После**:
```javascript
class Reading {
  constructor(data) { this._data = data; }

  get base() { ... }
  get taxableCharge() { ... }
  get calculateBaseCharge() { ... }
}
```

---

### Разделение фазы

**Когда применять**: Код имеет дело с двумя разными вещами

**Мотивация**: Разделить код на чёткие фазы с ясными границами.

**Механика**:
1. Создать вторую функцию для второй фазы
2. Протестировать
3. Ввести промежуточную структуру данных между фазами
4. Протестировать
5. Извлечь первую фазу в собственную функцию
6. Протестировать

**До**:
```javascript
function priceOrder(product, quantity, shippingMethod) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;
  const shippingPerCase = (basePrice > shippingMethod.discountThreshold)
    ? shippingMethod.discountedFee : shippingMethod.feePerCase;
  const shippingCost = quantity * shippingPerCase;
  return basePrice - discount + shippingCost;
}
```

**После**:
```javascript
function priceOrder(product, quantity, shippingMethod) {
  const priceData = calculatePricingData(product, quantity);
  return applyShipping(priceData, shippingMethod);
}

function calculatePricingData(product, quantity) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;
  return { basePrice, quantity, discount };
}

function applyShipping(priceData, shippingMethod) {
  const shippingPerCase = (priceData.basePrice > shippingMethod.discountThreshold)
    ? shippingMethod.discountedFee : shippingMethod.feePerCase;
  const shippingCost = priceData.quantity * shippingPerCase;
  return priceData.basePrice - priceData.discount + shippingCost;
}
```

---

## Перемещение функций

### Перенос метода

**Когда применять**: Метод использует больше функций другого класса, чем своего

**Мотивация**: Размещать функции рядом с данными, которые они используют больше всего.

**Механика**:
1. Изучить все программные элементы, используемые методом в его классе
2. Проверить, является ли метод полиморфным
3. Скопировать метод в целевой класс
4. Скорректировать для нового контекста
5. Сделать исходный метод делегатом к целевому
6. Протестировать
7. Рассмотреть удаление исходного метода

---

### Перенос поля

**Когда применять**: Поле используется больше другим классом

**Мотивация**: Хранить данные рядом с функциями, которые их используют.

**Механика**:
1. Инкапсулировать поле, если ещё не сделано
2. Протестировать
3. Создать поле в целевом классе
4. Обновить ссылки для использования целевого поля
5. Протестировать
6. Удалить исходное поле

---

### Перемещение операторов в функцию

**Когда применять**: Один и тот же код всегда появляется вместе с вызовом функции

**Мотивация**: Устранить дублирование, переместив повторяющийся код в функцию.

**Механика**:
1. Извлечь повторяющийся код в функцию, если ещё не сделано
2. Переместить операторы в эту функцию
3. Протестировать
4. Если вызывающие больше не нуждаются в самостоятельных операторах — удалить их

---

### Перемещение операторов к вызывающим

**Когда применять**: Общее поведение варьируется между вызывающими

**Мотивация**: Когда поведение должно различаться, вынести его из функции.

**Механика**:
1. Использовать Извлечение метода для кода, который нужно переместить
2. Использовать Встраивание метода для исходной функции
3. Удалить теперь встроенный вызов
4. Переместить извлечённый код к каждому вызывающему
5. Протестировать

---

## Организация данных

### Замена примитива объектом

**Когда применять**: Элемент данных нуждается в большем поведении, чем простое значение

**Мотивация**: Инкапсулировать данные вместе с их поведением.

**Механика**:
1. Применить Инкапсуляцию переменной
2. Создать простой класс значения
3. Изменить сеттер для создания нового экземпляра
4. Изменить геттер для возврата значения
5. Протестировать
6. Добавить более богатое поведение в новый класс

**До**:
```javascript
class Order {
  constructor(data) {
    this.priority = data.priority; // строка: "high", "rush" и т.д.
  }
}

// Использование
if (order.priority === "high" || order.priority === "rush") { ... }
```

**После**:
```javascript
class Priority {
  constructor(value) {
    if (!Priority.legalValues().includes(value))
      throw new Error(`Неверный приоритет: ${value}`);
    this._value = value;
  }

  static legalValues() { return ['low', 'normal', 'high', 'rush']; }
  get value() { return this._value; }

  higherThan(other) {
    return Priority.legalValues().indexOf(this._value) >
           Priority.legalValues().indexOf(other._value);
  }
}

// Использование
if (order.priority.higherThan(new Priority("normal"))) { ... }
```

---

### Замена временной переменной запросом

**Когда применять**: Временная переменная хранит результат выражения

**Мотивация**: Сделать код понятнее, извлекая выражение в функцию.

**Механика**:
1. Убедиться, что переменной присваивается значение только один раз
2. Извлечь правую часть присваивания в метод
3. Заменить ссылки на переменную вызовом метода
4. Протестировать
5. Удалить объявление и присваивание переменной

**До**:
```javascript
const basePrice = this._quantity * this._itemPrice;
if (basePrice > 1000) {
  return basePrice * 0.95;
} else {
  return basePrice * 0.98;
}
```

**После**:
```javascript
get basePrice() {
  return this._quantity * this._itemPrice;
}

// В методе
if (this.basePrice > 1000) {
  return this.basePrice * 0.95;
} else {
  return this.basePrice * 0.98;
}
```

---

## Упрощение условной логики

### Декомпозиция условия

**Когда применять**: Сложный условный оператор (if-then-else)

**Мотивация**: Прояснить намерение, извлекая условия и действия.

**Механика**:
1. Применить Извлечение метода к условию
2. Применить Извлечение метода к ветке then
3. Применить Извлечение метода к ветке else (при наличии)

**До**:
```javascript
if (!aDate.isBefore(plan.summerStart) && !aDate.isAfter(plan.summerEnd)) {
  charge = quantity * plan.summerRate;
} else {
  charge = quantity * plan.regularRate + plan.regularServiceCharge;
}
```

**После**:
```javascript
if (isSummer(aDate, plan)) {
  charge = summerCharge(quantity, plan);
} else {
  charge = regularCharge(quantity, plan);
}

function isSummer(date, plan) {
  return !date.isBefore(plan.summerStart) && !date.isAfter(plan.summerEnd);
}

function summerCharge(quantity, plan) {
  return quantity * plan.summerRate;
}

function regularCharge(quantity, plan) {
  return quantity * plan.regularRate + plan.regularServiceCharge;
}
```

---

### Консолидация условных выражений

**Когда применять**: Несколько условий с одинаковым результатом

**Мотивация**: Показать, что условия являются единой проверкой.

**Механика**:
1. Убедиться, что условия не имеют побочных эффектов
2. Объединить условия с помощью `and` или `or`
3. Рассмотреть Извлечение метода для объединённого условия

**До**:
```javascript
if (employee.seniority < 2) return 0;
if (employee.monthsDisabled > 12) return 0;
if (employee.isPartTime) return 0;
```

**После**:
```javascript
if (isNotEligibleForDisability(employee)) return 0;

function isNotEligibleForDisability(employee) {
  return employee.seniority < 2 ||
         employee.monthsDisabled > 12 ||
         employee.isPartTime;
}
```

---

### Замена вложенного условного сторожевыми операторами

**Когда применять**: Глубоко вложенные условия, затрудняющие понимание потока

**Мотивация**: Использовать сторожевые операторы для специальных случаев, сохраняя нормальный поток чётким.

**Механика**:
1. Найти специальные случаи условий
2. Заменить их сторожевыми операторами с ранним возвратом
3. Тестировать после каждого изменения

**До**:
```javascript
function payAmount(employee) {
  let result;
  if (employee.isSeparated) {
    result = { amount: 0, reasonCode: "SEP" };
  } else {
    if (employee.isRetired) {
      result = { amount: 0, reasonCode: "RET" };
    } else {
      result = calculateNormalPay(employee);
    }
  }
  return result;
}
```

**После**:
```javascript
function payAmount(employee) {
  if (employee.isSeparated) return { amount: 0, reasonCode: "SEP" };
  if (employee.isRetired) return { amount: 0, reasonCode: "RET" };
  return calculateNormalPay(employee);
}
```

---

### Замена условного полиморфизмом

**Когда применять**: Switch/case по типу, условная логика варьируется по типу

**Мотивация**: Позволить объектам обрабатывать собственное поведение.

**Механика**:
1. Создать иерархию классов (если нет)
2. Использовать фабричную функцию для создания объектов
3. Переместить условную логику в метод суперкласса
4. Создать метод подкласса для каждого случая
5. Удалить исходное условие

**До**:
```javascript
function plumage(bird) {
  switch (bird.type) {
    case 'EuropeanSwallow':
      return "average";
    case 'AfricanSwallow':
      return (bird.numberOfCoconuts > 2) ? "tired" : "average";
    case 'NorwegianBlueParrot':
      return (bird.voltage > 100) ? "scorched" : "beautiful";
    default:
      return "unknown";
  }
}
```

**После**:
```javascript
class Bird {
  get plumage() { return "unknown"; }
}

class EuropeanSwallow extends Bird {
  get plumage() { return "average"; }
}

class AfricanSwallow extends Bird {
  get plumage() {
    return (this.numberOfCoconuts > 2) ? "tired" : "average";
  }
}

class NorwegianBlueParrot extends Bird {
  get plumage() {
    return (this.voltage > 100) ? "scorched" : "beautiful";
  }
}
```

---

### Введение специального случая (Null-объект)

**Когда применять**: Повторяющиеся проверки на null для специальных случаев

**Мотивация**: Возвращать специальный объект, который обрабатывает специальный случай.

**Механика**:
1. Создать класс специального случая с ожидаемым интерфейсом
2. Добавить проверку isSpecialCase
3. Ввести фабричный метод
4. Заменить проверки на null использованием специального объекта
5. Протестировать

**До**:
```javascript
const customer = site.customer;
// ... многие места проверяют
if (customer === "unknown") {
  customerName = "жилец";
} else {
  customerName = customer.name;
}
```

**После**:
```javascript
class UnknownCustomer {
  get name() { return "жилец"; }
  get billingPlan() { return registry.defaultPlan; }
}

// Фабричный метод
function customer(site) {
  return site.customer === "unknown"
    ? new UnknownCustomer()
    : site.customer;
}

// Использование — проверки на null не нужны
const customerName = customer.name;
```

---

## Рефакторинг API

### Разделение запроса и модификатора

**Когда применять**: Функция и возвращает значение, и имеет побочные эффекты

**Мотивация**: Чётко показать, какие операции имеют побочные эффекты.

**Механика**:
1. Создать новую функцию запроса
2. Скопировать логику возврата исходной функции
3. Изменить исходную функцию, чтобы возвращала void
4. Заменить вызовы, использующие возвращаемое значение
5. Протестировать

**До**:
```javascript
function alertForMiscreant(people) {
  for (const p of people) {
    if (p === "Don") {
      setOffAlarms();
      return "Don";
    }
    if (p === "John") {
      setOffAlarms();
      return "John";
    }
  }
  return "";
}
```

**После**:
```javascript
function findMiscreant(people) {
  for (const p of people) {
    if (p === "Don") return "Don";
    if (p === "John") return "John";
  }
  return "";
}

function alertForMiscreant(people) {
  if (findMiscreant(people) !== "") setOffAlarms();
}
```

---

### Параметризация функции

**Когда применять**: Несколько функций, делающих похожие вещи с разными значениями

**Мотивация**: Устранить дублирование, добавив параметр.

**Механика**:
1. Выбрать одну функцию
2. Добавить параметр для варьируемого литерала
3. Изменить тело для использования параметра
4. Протестировать
5. Изменить вызывающих для использования параметризованной версии
6. Удалить теперь неиспользуемые функции

**До**:
```javascript
function tenPercentRaise(person) {
  person.salary = person.salary * 1.10;
}

function fivePercentRaise(person) {
  person.salary = person.salary * 1.05;
}
```

**После**:
```javascript
function raise(person, factor) {
  person.salary = person.salary * (1 + factor);
}

// Использование
raise(person, 0.10);
raise(person, 0.05);
```

---

### Удаление флагового аргумента

**Когда применять**: Булев параметр, изменяющий поведение функции

**Мотивация**: Сделать поведение явным через отдельные функции.

**Механика**:
1. Создать явную функцию для каждого значения флага
2. Заменить каждый вызов подходящей новой функцией
3. Тестировать после каждого изменения
4. Удалить исходную функцию

**До**:
```javascript
function bookConcert(customer, isPremium) {
  if (isPremium) {
    // логика премиум-бронирования
  } else {
    // логика обычного бронирования
  }
}

bookConcert(customer, true);
bookConcert(customer, false);
```

**После**:
```javascript
function bookPremiumConcert(customer) {
  // логика премиум-бронирования
}

function bookRegularConcert(customer) {
  // логика обычного бронирования
}

bookPremiumConcert(customer);
bookRegularConcert(customer);
```

---

## Работа с наследованием

### Подъём метода

**Когда применять**: Один и тот же метод в нескольких подклассах

**Мотивация**: Устранить дублирование в иерархии классов.

**Механика**:
1. Убедиться, что методы идентичны
2. Проверить, что сигнатуры одинаковы
3. Создать новый метод в суперклассе
4. Скопировать тело из одного подкласса
5. Удалить метод одного подкласса, протестировать
6. Удалить методы других подклассов, тестировать каждый

---

### Снижение метода

**Когда применять**: Поведение релевантно только для подмножества подклассов

**Мотивация**: Разместить метод там, где он используется.

**Механика**:
1. Скопировать метод в каждый подкласс, которому он нужен
2. Удалить метод из суперкласса
3. Протестировать
4. Удалить из подклассов, которым он не нужен
5. Протестировать

---

### Замена подкласса делегатом

**Когда применять**: Наследование используется неправильно, нужна большая гибкость

**Мотивация**: Предпочитать композицию наследованию, когда это уместно.

**Механика**:
1. Создать пустой класс для делегата
2. Добавить поле в класс-хост, хранящее делегат
3. Создать конструктор делегата, вызываемый из хоста
4. Переместить функции в делегат
5. Тестировать после каждого перемещения
6. Заменить наследование делегированием

---

## Извлечение класса

**Когда применять**: Большой класс с несколькими обязанностями

**Мотивация**: Разделить класс для сохранения единственной ответственности.

**Механика**:
1. Решить, как разделить обязанности
2. Создать новый класс
3. Переместить поле из исходного в новый класс
4. Протестировать
5. Переместить методы из исходного в новый класс
6. Тестировать после каждого перемещения
7. Просмотреть и переименовать оба класса
8. Решить, как показать новый класс

**До**:
```javascript
class Person {
  get name() { return this._name; }
  set name(arg) { this._name = arg; }
  get officeAreaCode() { return this._officeAreaCode; }
  set officeAreaCode(arg) { this._officeAreaCode = arg; }
  get officeNumber() { return this._officeNumber; }
  set officeNumber(arg) { this._officeNumber = arg; }

  get telephoneNumber() {
    return `(${this._officeAreaCode}) ${this._officeNumber}`;
  }
}
```

**После**:
```javascript
class Person {
  constructor() {
    this._telephoneNumber = new TelephoneNumber();
  }
  get name() { return this._name; }
  set name(arg) { this._name = arg; }
  get telephoneNumber() { return this._telephoneNumber.toString(); }
  get officeAreaCode() { return this._telephoneNumber.areaCode; }
  set officeAreaCode(arg) { this._telephoneNumber.areaCode = arg; }
}

class TelephoneNumber {
  get areaCode() { return this._areaCode; }
  set areaCode(arg) { this._areaCode = arg; }
  get number() { return this._number; }
  set number(arg) { this._number = arg; }
  toString() { return `(${this._areaCode}) ${this._number}`; }
}
```

---

## Быстрый справочник: Запах → Рефакторинг

| Запах кода | Основной рефакторинг | Альтернатива |
|------------|---------------------|-------------|
| Длинный метод | Извлечение метода | Замена временной переменной запросом |
| Дублированный код | Извлечение метода | Подъём метода |
| Большой класс | Извлечение класса | Извлечение подкласса |
| Длинный список параметров | Введение объекта-параметра | Сохранение целого объекта |
| Зависть к функциям | Перенос метода | Извлечение метода + Перенос |
| Группы данных | Извлечение класса | Введение объекта-параметра |
| Примитивная одержимость | Замена примитива объектом | Замена кода типа |
| Switch-операторы | Замена условного полиморфизмом | Замена кода типа |
| Временное поле | Извлечение класса | Введение Null-объекта |
| Цепочки сообщений | Скрытие делегата | Извлечение метода |
| Посредник | Удаление посредника | Встраивание метода |
| Дивергентное изменение | Извлечение класса | Разделение фазы |
| Операция дробовика | Перенос метода | Встраивание класса |
| Мёртвый код | Удаление мёртвого кода | — |
| Спекулятивная обобщённость | Свёртывание иерархии | Встраивание класса |

---

## Дополнительное чтение

- Fowler, M. (2018). *Рефакторинг: улучшение существующего кода* (2-е изд.)
- Онлайн-каталог: https://refactoring.com/catalog/
