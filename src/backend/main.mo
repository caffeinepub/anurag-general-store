import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Category = {
    #groceries;
    #beverages;
    #snacks;
    #household;
    #personalCare;
  };

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Category;
    imageUrl : Text;
    stock : Nat;
  };

  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  type Order = {
    id : Nat;
    user : Principal;
    items : [CartItem];
    total : Nat;
    timestamp : Time.Time;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  var nextProductId = 1;
  var nextOrderId = 1;

  let products = Map.empty<Nat, Product>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Principal, List.List<Order>>();

  public shared ({ caller }) func addProduct(name : Text, description : Text, price : Nat, category : Category, imageUrl : Text, stock : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    let product : Product = {
      id = nextProductId;
      name;
      description;
      price;
      category;
      imageUrl;
      stock;
    };

    products.add(product.id, product);
    nextProductId += 1;
  };

  public shared ({ caller }) func updateProduct(id : Nat, name : Text, description : Text, price : Nat, category : Category, imageUrl : Text, stock : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let product : Product = {
          id;
          name;
          description;
          price;
          category;
          imageUrl;
          stock;
        };
        products.add(id, product);
      };
    };
  };

  public shared ({ caller }) func removeProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove products");
    };
    products.remove(id);
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    let seenProductIds = Set.empty<Nat>();
    let allProducts = List.empty<Product>();

    for ((id, product) in products.entries()) {
      if (not seenProductIds.contains(id)) {
        allProducts.add(product);
        seenProductIds.add(id);
      };
    };

    allProducts.toArray();
  };

  public query ({ caller }) func getProductsByCategory(category : Category) : async [Product] {
    let seenProductIds = Set.empty<Nat>();
    let filteredProducts = List.empty<Product>();

    for ((id, product) in products.entries()) {
      if (product.category == category and not seenProductIds.contains(id)) {
        filteredProducts.add(product);
        seenProductIds.add(id);
      };
    };

    filteredProducts.toArray();
  };

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
    };

    if (quantity == 0) { Runtime.trap("Quantity must be greater than zero") };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        if (product.stock < quantity) { Runtime.trap("Not enough stock available") };

        let cart = switch (carts.get(caller)) {
          case (null) { List.empty<CartItem>() };
          case (?existingCart) { existingCart };
        };

        let cartArray = cart.toArray();
        let existingQuantity = cartArray.foldLeft(0, func(acc, item) { if (item.productId == productId) { acc + item.quantity } else { acc } });
        if (product.stock < (quantity + existingQuantity)) {
          Runtime.trap("Not enough stock available");
        };

        let updatedCart = cartArray.map(
          func(item) {
            if (item.productId == productId) {
              { item with quantity = item.quantity + quantity };
            } else {
              item;
            };
          }
        );

        let finalCart = if (existingQuantity == 0) { cartArray.concat([ { productId; quantity } ]) } else {
          updatedCart;
        };

        carts.add(caller, List.fromArray<CartItem>(finalCart));
      };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove items from cart");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?existingCart) { existingCart };
    };

    let updatedCart = cart.filter(func(item) { item.productId != productId });
    carts.add(caller, updatedCart);
  };

  public shared ({ caller }) func updateCartItem(productId : Nat, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cart items");
    };

    if (quantity == 0) { Runtime.trap("Quantity must be greater than zero") };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        switch (carts.get(caller)) {
          case (null) { Runtime.trap("Cart is empty") };
          case (?cart) {
            let cartArray = cart.toArray();
            let existingQuantity = cartArray.foldLeft(0, func(acc, item) { if (item.productId == productId) { acc + item.quantity } else { acc } });
            if (product.stock < (quantity + existingQuantity)) {
              Runtime.trap("Not enough stock available");
            };

            let finalCart = cartArray.map(
              func(item) {
                if (item.productId == productId) {
                  { item with quantity };
                } else {
                  item;
                };
              }
            );
            carts.add(caller, List.fromArray<CartItem>(finalCart));
          };
        };
      };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };

    carts.remove(caller);
  };

  public shared ({ caller }) func placeOrder() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) { cart };
    };

    let seenProductIds = Set.empty<Nat>();
    let uniqueItems = List.empty<CartItem>();

    let cartArray = cart.toArray();
    for (item in cartArray.values()) {
      if (not seenProductIds.contains(item.productId)) {
        uniqueItems.add(item);
        seenProductIds.add(item.productId);
      };
    };

    if (uniqueItems.isEmpty()) { Runtime.trap("Cart is empty") };
    let itemsArray = uniqueItems.toArray();
    let total = itemsArray.foldLeft(0, func(acc, item) {
      let price = switch (products.get(item.productId)) {
        case (null) { 0 };
        case (?product) { product.price };
      };
      acc + (price * item.quantity);
    });

    let order : Order = {
      id = nextOrderId;
      user = caller;
      items = itemsArray;
      total;
      timestamp = Time.now();
    };

    let userOrders = switch (orders.get(caller)) {
      case (null) { List.empty<Order>() };
      case (?existingOrders) { existingOrders };
    };
    userOrders.add(order);
    orders.add(caller, userOrders);

    for (item in itemsArray.values()) {
      switch (products.get(item.productId)) {
        case (null) {};
        case (?product) {
          let updatedProduct = { product with stock = product.stock - item.quantity };
          products.add(item.productId, updatedProduct);
        };
      };
    };

    carts.remove(caller);
    nextOrderId += 1;
  };

  public query ({ caller }) func getOrderHistory(user : Principal) : async [Order] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own order history");
    };

    let userOrders = switch (orders.get(user)) {
      case (null) { List.empty<Order>() };
      case (?orders) { orders };
    };
    userOrders.toArray();
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };
    cart.toArray();
  };

  public shared ({ caller }) func seedWithSampleProducts() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed products");
    };

    let samples : [Product] = [
      { id = 0; name = "Rice 5kg"; description = "Premium basmati rice"; price = 5000; category = #groceries; imageUrl = "/images/rice.jpg"; stock = 50 },
      { id = 0; name = "Wheat Flour 1kg"; description = "Freshly milled wheat flour"; price = 1200; category = #groceries; imageUrl = "/images/flour.jpg"; stock = 30 },
      { id = 0; name = "Milk 1L"; description = "Full cream milk"; price = 450; category = #beverages; imageUrl = "/images/milk.jpg"; stock = 40 },
      { id = 0; name = "Biscuits"; description = "Crunchy biscuits pack"; price = 350; category = #snacks; imageUrl = "/images/biscuits.jpg"; stock = 100 },
      { id = 0; name = "Soap Bar"; description = "Gentle cleansing soap"; price = 200; category = #personalCare; imageUrl = "/images/soap.jpg"; stock = 60 },
      { id = 0; name = "Cooking Oil 1L"; description = "Pure sunflower oil"; price = 1800; category = #groceries; imageUrl = "/images/oil.jpg"; stock = 25 },
      { id = 0; name = "Toothpaste"; description = "Fresh mint toothpaste"; price = 150; category = #personalCare; imageUrl = "/images/toothpaste.jpg"; stock = 80 },
      { id = 0; name = "Soft Drinks 500ml"; description = "Carbonated soft drinks"; price = 220; category = #beverages; imageUrl = "/images/softdrinks.jpg"; stock = 70 },
      { id = 0; name = "Detergent Powder"; description = "Powerful cleaning detergent"; price = 900; category = #household; imageUrl = "/images/detergent.jpg"; stock = 35 },
      { id = 0; name = "Noodles Pack"; description = "Instant noodles pack"; price = 300; category = #snacks; imageUrl = "/images/noodles.jpg"; stock = 90 },
      { id = 0; name = "Tea Leaves 250g"; description = "Aromatic tea leaves"; price = 700; category = #beverages; imageUrl = "/images/tea.jpg"; stock = 45 },
      { id = 0; name = "Shampoo Bottle"; description = "Nourishing shampoo"; price = 320; category = #personalCare; imageUrl = "/images/shampoo.jpg"; stock = 55 },
      { id = 0; name = "Sugar 1kg"; description = "White crystal sugar"; price = 750; category = #groceries; imageUrl = "/images/sugar.jpg"; stock = 60 },
      { id = 0; name = "Room Freshener"; description = "Long-lasting room freshener"; price = 250; category = #household; imageUrl = "/images/freshener.jpg"; stock = 40 },
      { id = 0; name = "Chips Packet"; description = "Crispy potato chips"; price = 180; category = #snacks; imageUrl = "/images/chips.jpg"; stock = 110 },
    ];

    for (sample in samples.values()) {
      let product : Product = { sample with id = nextProductId };
      products.add(product.id, product);
      nextProductId += 1;
    };
  };
};
