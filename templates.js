const fs = require('fs').promises;
const path = require('path');

class TemplateEngine {
  constructor(viewsPath = './views') {
    this.viewsPath = viewsPath;
    this.cache = new Map();
  }

  // Renderizar template con datos
  async render(templateName, data = {}) {
    const layoutPath = path.join(this.viewsPath, 'layouts.html');
    const templatePath = path.join(this.viewsPath, `${templateName}.html`);

    try {
      // Cargar plantilla de layout y vista (con cache)
      if (!this.cache.has(layoutPath)) {
        this.cache.set(layoutPath, await fs.readFile(layoutPath, 'utf8'));
      }
      if (!this.cache.has(templatePath)) {
        this.cache.set(templatePath, await fs.readFile(templatePath, 'utf8'));
      }

      let layout = this.cache.get(layoutPath);
      let template = this.cache.get(templatePath);
      
      // Renderizar el contenido de la vista específica primero
      let renderedContent = this.processTemplate(template, data);
      
      // Incrustar el contenido renderizado en el layout
      let finalHtml = layout.replace('{{{content}}}', renderedContent);

      // Renderizar el resto de placeholders en el layout (como el título)
      finalHtml = this.processTemplate(finalHtml, data);

      return finalHtml;

    } catch (error) {
      throw new Error(`Error al renderizar template ${templateName}: ${error.message}`);
    }
  }

  processTemplate(template, data){
    const resolver = (path, obj) => path.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), obj);

    // Soporte para condicionales {{#if condicion}}...{{/if}}
    template = template.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, conditionName, templateContent) => {
      const value = resolver(conditionName, data);
      if (value) {
        return templateContent;
      }
      return '';
    });

    // Soporte para bucles básicos {{#each items}}{{/each}}
    template = template.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, templateContent) => {
      const array = data[arrayName] || [];
      if(!Array.isArray(array))return '';
      return array.map(item => {
        // Reemplazar propiedades del item {{propiedad}}
        return templateContent.replace(/\{\{([\w.]+)\}\}/g, (match, prop) => {
          // Dentro del bucle, el contexto es el 'item'
          const value = resolver(prop, item);
          return value !== undefined && value !== null ? value : '';
        });
      }).join('');
    });

    // Reemplazar variables simples {{variable}} o {{objeto.propiedad}}
    template = template.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
      const value = resolver(key, data);
      return value !== undefined && value !== null ? value : '';
    });

    return template;
  }


  // Limpiar cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = TemplateEngine;