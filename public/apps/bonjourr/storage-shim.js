/*
 * Cloisonnement du stockage de Bonjourr (chargé avant ses scripts, voir scripts/bonjourr/update.mjs).
 *
 * Bonjourr est servi sur la même origine que le site : sans ce fichier, il partagerait le
 * localStorage et le sessionStorage du site. Or sa fonction « Réinitialiser » supprime toutes les
 * clés de l'origine (clearall, src/scripts/storage.ts de Bonjourr), session Supabase comprise.
 *
 * On remplace donc window.localStorage et window.sessionStorage, dans l'iframe uniquement, par une
 * vue qui préfixe chaque clé : Bonjourr ne voit et ne modifie que ses propres données.
 */
(function () {
  "use strict";

  var PREFIX = "bonjourr:";

  function namespaced(storage) {
    function keys() {
      var result = [];
      for (var i = 0; i < storage.length; i++) {
        var key = storage.key(i);
        if (key !== null && key.indexOf(PREFIX) === 0) {
          result.push(key.slice(PREFIX.length));
        }
      }
      return result;
    }

    var api = {
      getItem: function (key) {
        return storage.getItem(PREFIX + key);
      },
      setItem: function (key, value) {
        storage.setItem(PREFIX + key, String(value));
      },
      removeItem: function (key) {
        storage.removeItem(PREFIX + key);
      },
      clear: function () {
        keys().forEach(function (key) {
          storage.removeItem(PREFIX + key);
        });
      },
      key: function (index) {
        var list = keys();
        return index >= 0 && index < list.length ? list[index] : null;
      },
    };

    // Accès par propriété (localStorage.bonjourr, Object.keys(localStorage)…), comme sur un vrai Storage
    return new Proxy(
      {},
      {
        get: function (_target, prop) {
          if (typeof prop === "symbol") return undefined;
          if (prop === "length") return keys().length;
          if (Object.prototype.hasOwnProperty.call(api, prop)) return api[prop];
          var value = storage.getItem(PREFIX + prop);
          return value === null ? undefined : value;
        },
        set: function (_target, prop, value) {
          storage.setItem(PREFIX + String(prop), String(value));
          return true;
        },
        deleteProperty: function (_target, prop) {
          storage.removeItem(PREFIX + String(prop));
          return true;
        },
        has: function (_target, prop) {
          if (prop === "length" || Object.prototype.hasOwnProperty.call(api, prop)) return true;
          return storage.getItem(PREFIX + String(prop)) !== null;
        },
        ownKeys: function () {
          return keys();
        },
        getOwnPropertyDescriptor: function (_target, prop) {
          var value = storage.getItem(PREFIX + String(prop));
          if (value === null) return undefined;
          return { value: value, writable: true, enumerable: true, configurable: true };
        },
      }
    );
  }

  var local = namespaced(window.localStorage);
  var session = namespaced(window.sessionStorage);

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    enumerable: true,
    get: function () {
      return local;
    },
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    enumerable: true,
    get: function () {
      return session;
    },
  });
})();
