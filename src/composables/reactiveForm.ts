import { computed, nextTick, reactive, ref, watch } from "vue";
import _ from "lodash";
import { FormItemRule, FormRules } from "naive-ui";

export function useReactiveForm(formConfig: any = {}, formRef: any = ref(null)) {
  const form = reactive(formConfig);
  const initialForm = reactive({ ...formConfig });
  const neededKeys = ref<string[]>([]);
  const validKeys = ref<string[]>([]);
  const isValid = computed(() => {
    return _.chain(neededKeys.value)
      .every(key => validKeys.value.includes(key) && form[key] !== "")
      .value();
  });

  function validateField(key: string) {
    formRef.value?.validate(
      (errors: any[]) => {
        if (!errors) {
          if (!validKeys.value.includes(key)) {
            validKeys.value.push(key);
          }
        } else {
          validKeys.value = _.reject(validKeys.value, item => item === key);
        }
      },
      (rule: any) => {
        return rule?.key === key;
      }
    );
  }

  async function reset() {
    _.forEach(initialForm, (value: any, key: string) => {
      form[key] = value;
    });

    await nextTick();
    formRef.value?.restoreValidation();
  }

  watch(
    () => formRef.value?.rules,
    rules => {
      neededKeys.value = _.chain(rules)
        .pickBy(rule => _.some(rule, item => item.required || item.validator))
        .keys()
        .value();
    },
    { deep: true }
  );

  watch(
    () => ({ ...form }),
    (newFormValue, oldFormValue) => {
      const changedKeys = _.chain(newFormValue)
        .keys()
        .filter(key => newFormValue[key] !== oldFormValue[key])
        .value();

      if (changedKeys.length > 0) {
        _.chain(changedKeys)
          .forEach(key => {
            if (neededKeys.value.includes(key)) {
              validateField(key);
            }
          })
          .value();
      }
    },
    { deep: true }
  );

  return {
    form,
    reset,
    isValid,
    neededKeys,
    validKeys,
  };
}

export function useReactiveRules(rulesConfig: FormRules) {
  return computed(() => {
    return _.mapValues(rulesConfig, (rules, key) => {
      return _.map(rules, (rule: FormItemRule) => {
        return { ...rule, key };
      });
    });
  });
}
